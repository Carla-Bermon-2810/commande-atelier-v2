import { Suspense } from "react";
import AccessForm from "@/components/access/AccessForm";

export default function AccessPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><div className="w-full max-w-md"><Suspense fallback={<div className="h-96 rounded-2xl bg-white" />}><AccessForm /></Suspense></div></main>;
}
