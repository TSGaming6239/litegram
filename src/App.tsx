import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Spinner } from './components/Spinner';
import { AppLayout } from './layouts/AppLayout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const HomeFeed = lazy(() => import('./pages/HomeFeed'));
const Explore = lazy(() => import('./pages/Explore'));
const Search = lazy(() => import('./pages/Search'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Saved = lazy(() => import('./pages/Saved'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const EditPost = lazy(() => import('./pages/EditPost'));
const Drafts = lazy(() => import('./pages/Drafts'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route
                  path="/login"
                  element={
                    <PublicOnly>
                      <Login />
                    </PublicOnly>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnly>
                      <Register />
                    </PublicOnly>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicOnly>
                      <ForgotPassword />
                    </PublicOnly>
                  }
                />

                <Route
                  path="/feed"
                  element={
                    <Protected>
                      <HomeFeed />
                    </Protected>
                  }
                />
                <Route
                  path="/explore"
                  element={
                    <Protected>
                      <Explore />
                    </Protected>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <Protected>
                      <Search />
                    </Protected>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <Protected>
                      <Notifications />
                    </Protected>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <Protected>
                      <Saved />
                    </Protected>
                  }
                />
                <Route
                  path="/posts/new"
                  element={
                    <Protected>
                      <CreatePost />
                    </Protected>
                  }
                />
                <Route
                  path="/posts/:id/edit"
                  element={
                    <Protected>
                      <EditPost />
                    </Protected>
                  }
                />
                <Route
                  path="/posts/drafts"
                  element={
                    <Protected>
                      <Drafts />
                    </Protected>
                  }
                />
                <Route
                  path="/post/:id"
                  element={
                    <Protected>
                      <PostDetail />
                    </Protected>
                  }
                />
                <Route
                  path="/u/:username"
                  element={
                    <Protected>
                      <Profile />
                    </Protected>
                  }
                />
                <Route
                  path="/profile/edit"
                  element={
                    <Protected>
                      <EditProfile />
                    </Protected>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Protected>
                      <Settings />
                    </Protected>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
