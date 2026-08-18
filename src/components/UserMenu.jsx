import { useAuth } from '../auth/AuthProvider';

export default function UserMenu() {
  const { profile, keycloak, logout } = useAuth();
  // console.log(profile)

  const name = profile?.firstName
    ? `${profile.firstName} ${profile.attributes.department || ''}`.trim()
    : keycloak?.tokenParsed?.preferred_username || 'User';

  return (
    <div className="user-menu">
      <span className="user-name">{name}</span>
      <button type="button" className="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}