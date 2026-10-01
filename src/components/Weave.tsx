export default function Weave({ loading = false }: { loading?: boolean }) {
  return <div className={`weave ${loading ? "weave-loading" : ""}`} aria-hidden />;
}
