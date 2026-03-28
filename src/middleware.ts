import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
<<<<<<< HEAD
  matcher: ["/", "/(en|es)/:path*", "/admin/:path*"],
=======
  matcher: ["/((?!api|_next|.*\\..*).*)"],
>>>>>>> 75bea018c27a2c0bae5e1583e7c5d00233428071
};
