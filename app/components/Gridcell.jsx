export default function GridCell({ letter, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        border: '1px solid black',
        backgroundColor: isActive ? 'lightblue' : 'white',
        textAlign: 'center',
        lineHeight: '40px',
        fontWeight: 'bold',
      }}
    >
      {letter}
    </div>
  );
}
