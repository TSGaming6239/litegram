export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          bio: string | null;
          website: string | null;
          location: string | null;
          birthday: string | null;
          accent_color: string;
          last_login_date: string | null;
          login_streak: number;
          longest_streak: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          birthday?: string | null;
          accent_color?: string;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          website?: string | null;
          location?: string | null;
          birthday?: string | null;
          accent_color?: string;
          last_login_date?: string | null;
          login_streak?: number;
          longest_streak?: number;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          caption: string | null;
          mood_key: string | null;
          location: string | null;
          prompt_id: string | null;
          pinned: boolean;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          image_url: string;
          caption?: string | null;
          mood_key?: string | null;
          location?: string | null;
          prompt_id?: string | null;
          pinned?: boolean;
        };
        Update: {
          caption?: string | null;
          mood_key?: string | null;
          location?: string | null;
          pinned?: boolean;
        };
      };
      post_images: {
        Row: {
          id: string;
          post_id: string;
          image_url: string;
          position: number;
        };
        Insert: {
          post_id: string;
          image_url: string;
          position?: number;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id?: string;
          content: string;
        };
      };
      likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          kind: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id?: string;
          kind: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          follower_id?: string;
          followee_id: string;
        };
      };
      saved_posts: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id?: string;
          post_id: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          type: string;
          post_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          actor_id?: string | null;
          type: string;
          post_id?: string | null;
          read?: boolean;
        };
      };
      achievements: {
        Row: {
          id: number;
          key: string;
          label: string;
          description: string;
          icon: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: number;
          awarded_at: string;
        };
        Insert: {
          user_id?: string;
          achievement_id: number;
        };
      };
      mood_tags: {
        Row: {
          id: number;
          key: string;
          label: string;
          emoji: string;
        };
      };
      daily_prompts: {
        Row: {
          id: string;
          prompt_text: string;
          day: string;
          created_at: string;
        };
        Insert: {
          prompt_text: string;
          day?: string;
        };
      };
      drafts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string | null;
          caption: string | null;
          mood_key: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          image_url?: string | null;
          caption?: string | null;
          mood_key?: string | null;
          location?: string | null;
        };
        Update: {
          image_url?: string | null;
          caption?: string | null;
          mood_key?: string | null;
          location?: string | null;
        };
      };
    };
  };
};
