// Yalnızca uygulamanın desteklediği hedefler; dış URL'lere yönlendirme yok.
export function authDestination(value: unknown): "/create" | "/dashboard" {
  return value === "/create" ? "/create" : "/dashboard";
}
