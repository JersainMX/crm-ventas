import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { fetchMe } from './store/slices/authSlice';
import Spinner from './components/common/Spinner';

export default function App() {
  const dispatch = useDispatch();
  const { token, initialized } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !initialized) {
      dispatch(fetchMe());
    }
  }, [token, initialized, dispatch]);

  if (token && !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <AppRoutes />;
}