import { useAppDispatch, useAppSelector } from "./app/hooks";
import { login, logout } from "./features/auth/authSlice";

function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  return (
    <>
      <div>
        <p>User: {user ?? "Guest"}</p>
        <button onClick={() => dispatch(login("John"))}>Login</button>
        <button onClick={() => dispatch(logout())}>Logout</button>
      </div>
    </>
  );
}

export default App;
