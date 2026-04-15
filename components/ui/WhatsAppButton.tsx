"use client";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/51961700746"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatea con nosotros por WhatsApp"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 flex-row-reverse"
    >
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] shadow-lg transition-transform duration-200 hover:scale-110">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-7 h-7 fill-white"
          aria-hidden="true"
        >
          <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.347.638 4.64 1.848 6.638L2.667 29.333l6.895-1.808A13.27 13.27 0 0 0 16.003 29.333c7.363 0 13.33-5.97 13.33-13.333S23.366 2.667 16.003 2.667zm0 24.267a11.017 11.017 0 0 1-5.617-1.537l-.403-.24-4.09 1.073 1.09-3.983-.263-.41A10.97 10.97 0 0 1 5.003 16c0-6.065 4.935-11 11-11s11 4.935 11 11-4.935 11-11 11zm6.03-8.23c-.33-.165-1.953-.963-2.256-1.073-.303-.11-.524-.165-.744.165-.22.33-.854 1.073-1.047 1.293-.193.22-.386.247-.716.082-.33-.165-1.393-.513-2.653-1.637-.98-.874-1.642-1.953-1.834-2.283-.193-.33-.02-.508.145-.672.149-.148.33-.386.495-.58.165-.192.22-.33.33-.55.11-.22.055-.413-.027-.578-.082-.165-.744-1.793-1.02-2.455-.27-.644-.543-.557-.744-.567l-.634-.011a1.22 1.22 0 0 0-.882.413c-.303.33-1.155 1.128-1.155 2.75s1.183 3.19 1.348 3.41c.165.22 2.327 3.554 5.641 4.984.788.34 1.403.543 1.882.695.79.252 1.51.216 2.078.131.634-.094 1.953-.799 2.228-1.57.276-.772.276-1.433.193-1.57-.082-.138-.303-.22-.633-.385z" />
        </svg>
      </div>
      <span className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
        Chatea con nosotros
      </span>
    </a>
  );
}
