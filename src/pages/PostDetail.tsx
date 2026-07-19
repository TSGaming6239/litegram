import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Avatar } from '../components/Avatar';
import { EmojiPicker } from '../components/EmojiPicker';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  fetchPostById,
  fetchComments,
  addComment,
  deleteComment,
} from '../services/posts';
import { timeAgo } from '../utils/format';
import type { PostWithRelations } from '../types';

type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { id: string; username: string; avatar_url: string | null } | null;
};

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement | null>(null);

  const load = useCallback(async () => {
    if (!id || !session) return;
    try {
      const [p, c] = await Promise.all([
        fetchPostById(id, session.user.id),
        fetchComments(id),
      ]);
      setPost(p);
      setComments(c as CommentRow[]);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, session, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !session || !id) return;
    setPosting(true);
    try {
      await addComment(id, text.trim(), session.user.id);
      setText('');
      await load();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setPosting(false);
    }
  };

  const onDelete = async (cid: string) => {
    try {
      await deleteComment(cid);
      setComments((c) => c.filter((x) => x.id !== cid));
      toast('Comment removed.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!post) {
    return (
      <EmptyState
        title="Post not found"
        description="It may have been deleted or the link is wrong."
        action={
          <Link to="/feed" className="btn-primary">
            Back to feed
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PostCard post={post} onDeleted={() => navigate('/feed')} />
      <section className="card p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">
          Comments ({comments.length})
        </h2>
        <form onSubmit={submitComment} className="mb-4 flex items-start gap-2">
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.username ?? 'You'}
            size={36}
          />
          <div className="relative flex-1">
            <textarea
              ref={commentRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="input resize-none pr-10"
              placeholder="Add a comment…"
              aria-label="Add a comment"
            />
            <div className="absolute right-1.5 top-1.5">
              <EmojiPicker
                onPick={(emoji) => {
                  const el = commentRef.current;
                  if (!el) {
                    setText((t) => t + emoji);
                    return;
                  }
                  const start = el.selectionStart ?? text.length;
                  const end = el.selectionEnd ?? text.length;
                  const next = text.slice(0, start) + emoji + text.slice(end);
                  setText(next);
                  requestAnimationFrame(() => {
                    el.focus();
                    const pos = start + emoji.length;
                    el.setSelectionRange(pos, pos);
                  });
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="btn-primary self-stretch px-3"
            aria-label="Post comment"
          >
            {posting ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No comments yet — start the conversation.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <Link to={c.profiles ? `/u/${c.profiles.username}` : '#'}>
                  <Avatar
                    src={c.profiles?.avatar_url}
                    alt={c.profiles?.username ?? 'User'}
                    size={32}
                  />
                </Link>
                <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Link
                      to={c.profiles ? `/u/${c.profiles.username}` : '#'}
                      className="text-sm font-semibold hover:underline"
                    >
                      @{c.profiles?.username ?? 'unknown'}
                    </Link>
                    <span className="text-xs text-slate-400">
                      {timeAgo(c.created_at)}
                    </span>
                    {c.user_id === session?.user.id && (
                      <button
                        onClick={() => onDelete(c.id)}
                        aria-label="Delete comment"
                        className="ml-auto rounded-md p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
