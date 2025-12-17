export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to HTGA
        </h1>
        <p className="text-gray-600 mb-8">
          HalalTrip Gastronomy Award Application
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/admin"
            className="px-6 py-3 bg-[#A67C37] text-white rounded-lg hover:bg-[#8B6830] transition"
          >
            Admin Panel
          </a>
          <a
            href="/htga/login"
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Evaluator Login
          </a>
        </div>
      </div>
    </div>
  );
}
