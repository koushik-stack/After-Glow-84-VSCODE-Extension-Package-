export function Cassette({ title = "Afterglow" }) {
  return <section className="cassette"><h1>{title}</h1><button onClick={() => console.log(title)}>Play</button></section>;
}
