export default function Page() {
  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
      }}
    >
      <img
        src="/reposo.png"
        alt="Pantalla de reposo"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </main>
  );
}
