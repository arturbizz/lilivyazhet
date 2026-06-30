export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/80 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center text-gray-500 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-gray-700">ЛилиВяжет</span>
          <span className="hidden sm:inline">— ручная работа с душой</span>
        </div>
        <div className="mt-2 sm:mt-0">
          © {new Date().getFullYear()} Все права защищены
        </div>
      </div>
    </footer>
  );
}
