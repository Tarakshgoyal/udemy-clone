import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1c1d1f] text-white pt-8 pb-12 mt-12 border-t border-gray-700">
      <div className="max-w-[1340px] mx-auto px-6">
        
        {/* Teach on Udemy Section */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-600 pb-8 mb-8">
          <div>
            <h2 className="text-xl font-bold mb-2">Teach the world online</h2>
            <p className="text-gray-300">
              Create an online video course, reach students across the globe, and earn money
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button className="border border-white hover:bg-gray-800 transition-colors font-bold px-4 py-2">
              Teach on Udemy
            </button>
          </div>
        </div>

        {/* Top Companies Section */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-600 pb-8 mb-8">
          <h2 className="text-xl font-bold mb-4 md:mb-0">
            Top companies choose <span className="text-[#c0c4fc]">Udemy Business</span> to build in-demand career skills.
          </h2>
          <div className="flex flex-wrap items-center gap-6 opacity-80">
            <span className="font-bold text-xl tracking-widest">Nasdaq</span>
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold">W</div>
            <span className="font-bold text-lg">NetApp</span>
            <span className="font-bold text-xl italic text-orange-400">eventbrite</span>
          </div>
        </div>

        {/* Explore Links Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">Explore top skills and certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4 text-gray-200">In-demand Careers</h3>
              <ul className="space-y-2 text-sm text-[#c0c4fc]">
                <li><Link href="#" className="hover:underline">Data Scientist</Link></li>
                <li><Link href="#" className="hover:underline">Full Stack Web Developer</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-200">Web Development</h3>
              <ul className="space-y-2 text-sm text-[#c0c4fc]">
                <li><Link href="#" className="hover:underline">Web Development</Link></li>
                <li><Link href="#" className="hover:underline">JavaScript</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-200">IT Certifications</h3>
              <ul className="space-y-2 text-sm text-[#c0c4fc]">
                <li><Link href="#" className="hover:underline">Amazon AWS</Link></li>
                <li><Link href="#" className="hover:underline">AWS Certified Cloud Practitioner</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-200">Leadership</h3>
              <ul className="space-y-2 text-sm text-[#c0c4fc]">
                <li><Link href="#" className="hover:underline">Leadership</Link></li>
                <li><Link href="#" className="hover:underline">Management Skills</Link></li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
