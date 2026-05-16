import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/env";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/select-org(.*)",
  "/api/webhooks(.*)",
]);

const requiresOrganization = createRouteMatcher([
  "/dashboard(.*)",
  "/syllabuses(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isClerkConfigured) return;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  if (requiresOrganization(req)) {
    const { orgId } = await auth();
    if (!orgId) {
      const url = new URL("/select-org", req.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
