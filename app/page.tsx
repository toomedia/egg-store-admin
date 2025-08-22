// "use client"
// import { supabase } from "../utils/supabaseClient";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Dashboard from "./dashboard/page";
// export default function Home() {
//   return (
//     <div>
// <Dashboard/>
//     </div>
//   );
// }


'use client';

import Dashboard from './dashboard/page';

export default function Home() {
  return <Dashboard />;
}
