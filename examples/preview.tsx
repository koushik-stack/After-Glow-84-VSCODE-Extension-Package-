interface CassetteProps { title: string; year?: number }
export function Cassette({ title, year = 1984 }: CassetteProps) {
  return <article data-year={year}><h1>{title}</h1><p>Golden hour</p></article>;
}
