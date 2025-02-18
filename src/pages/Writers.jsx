import { Link } from "react-router-dom";

const dummyWriters = [
  { id: 1, name: "John Doe", rating: 4.8, pricePerPage: 10, minPages: 2, maxPages: 10 },
  { id: 2, name: "Jane Smith", rating: 4.5, pricePerPage: 12, minPages: 1, maxPages: 5 },
  { id: 3, name: "Alex Brown", rating: 4.7, pricePerPage: 8, minPages: 3, maxPages: 15 },
];

const Writers = () => {
  return (
    <div className="max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-bold text-center">Available Writers</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {dummyWriters.map((writer) => (
          <div key={writer.id} className="border p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold">{writer.name}</h3>
            <p>⭐ {writer.rating}/5</p>
            <p>💰 Price: ${writer.pricePerPage}/page</p>
            <p>📄 Min Pages: {writer.minPages}</p>
            <p>📃 Max Pages: {writer.maxPages}</p>
            <Link
              to={`/writer/${writer.id}`}
              className="mt-2 block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Writers;
