/* navbar */import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Demo login state stored in localStorage
    try {
      setSignedIn(!!localStorage.getItem("demo_user"));
    } catch {
      setSignedIn(false);
    }
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo left */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 text-white font-bold rounded-md flex items-center justify-center">
            D
          </div>
          <Link href="/">
            <span className="font-semibold text-slate-800 cursor-pointer">
              DeepVerify
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-slate-700">
          {!signedIn ? (
            <button
              onClick={() => {
                localStorage.setItem("demo_user", "1");
                location.reload();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Sign In
            </button>
          ) : (
            <>
              <Link href="/dashboard">
                <span className="hover:text-indigo-600 cursor-pointer">
                  Dashboard
                </span>
              </Link>

              <Link href="/membership">
                <span className="hover:text-indigo-600 cursor-pointer">
                  Membership
                </span>
              </Link>

              <Link href="/support">
                <span className="hover:text-indigo-600 cursor-pointer">
                  Support
                </span>
              </Link>

              <button
                onClick={() => {
                  localStorage.removeItem("demo_user");
                  location.href = "/";
                }}
                className="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100"
              >
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
