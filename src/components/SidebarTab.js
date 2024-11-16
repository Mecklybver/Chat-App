export default function SidebarTab({ isActive, onClick, children }) {
  return (
    <div
      className={`${isActive ? "sidebar__menu--selected" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
