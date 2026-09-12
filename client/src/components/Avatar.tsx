interface Props {
  username: string;
  url?: string | null;
  size?: number;
}

// Cvetut se izchislyava ot imeto — edin i sushti chovek vinagi
// poluchava edin i sushti cvyat, bez da go pazim nikude.
function colorFor(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 55% 45%)`;
}

function Avatar({ username, url, size = 40 }: Props) {
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (url) {
    return <img className="avatar" src={url} alt={username} style={style} />;
  }

  // nyama snimka → purvata bukva vurhu cvetno krugche
  return (
    <span
      className="avatar avatar-fallback"
      style={{ ...style, background: colorFor(username) }}
    >
      {username[0]?.toUpperCase()}
    </span>
  );
}

export default Avatar;
