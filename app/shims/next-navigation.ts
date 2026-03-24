import { navigateTo, useRoute, useRouter as useNuxtRouter } from "#app";

export const useRouter = () => {
  const router = useNuxtRouter();

  return {
    ...router,
    push: (to: string) => navigateTo(to),
    replace: (to: string) => navigateTo(to, { replace: true }),
  };
};

export const usePathname = () => useRoute().path;

export const useSearchParams = () =>
  new URLSearchParams(
    Object.entries(useRoute().query).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => [key, String(item)])
        : value == null
          ? []
          : [[key, String(value)]],
    ),
  );

export const redirect = (to: string) => navigateTo(to);

export const notFound = () => {
  throw createError({ statusCode: 404, statusMessage: "Not Found" });
};
