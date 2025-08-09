import { useUser } from "@clerk/clerk-react";

function Header() {
  const { user } = useUser();
  return (
    <header>
      <h1>Welcome {user?.firstName || "Player"}!</h1>
      {/* User stats will be filled on Day 2 */}
    </header>
  );
}

export default Header;
