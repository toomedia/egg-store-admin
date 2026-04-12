import { redirect } from "next/navigation";

export default function OrdersRedirect({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    }
  });

  const queryString = params.toString();
  redirect(queryString ? `/dashboard/ownership?${queryString}` : "/dashboard/ownership");
}
