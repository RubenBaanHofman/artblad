// Fill in the two values from Supabase: Project Settings > API (Project URL and the publishable / anon key).
// The key is meant to be public; the database rules in setup/setup.sql decide who can read and write.
window.ARTBLAD_CONFIG = {
  SUPABASE_URL: "https://wtiawlftobnvmumisopd.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_G-iB71BzB5X6b_j5JwWMbw_a7yuArbV",
  // false: everyone must sign in to see anything. true: anyone with the link can read, only editors can change.
  // If you set this to true, also use the "public read" block in setup/setup.sql.
  PUBLIC_READ: false,
  // Optional: the address printed in the QR codes on sheets. Leave empty to use the address the site is opened from.
  SITE_URL: ""
};
