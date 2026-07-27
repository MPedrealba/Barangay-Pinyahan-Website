'use client';
import PublicShell from '@/components/PublicShell';

export default function AboutPage() {
  return (
    <PublicShell activeHref="/about">
      {/* Hero Full */}
      <section className="overflow-hidden bg-[#003366]">
        <img src="https://placehold.co/1200x500?text=Barangay+Multi-Purpose+Hall" alt="Barangay Hall"
          className="w-full h-auto block max-h-[520px] object-cover" />
      </section>

      {/* History */}
      <section className="w-[90%] max-w-[1200px] mx-auto py-8">
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6">BARANGAY HISTORY</h3>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
            <div className="flex-[2] leading-relaxed md:leading-loose text-justify text-sm md:text-base text-gray-700">
              <p>Barangay Pinyahan was originally located along Malakas Street. Back then, the barangay watchmen or tanods were simply called volunteers as they served without expecting anything in return. Eventually, the barangay hall was transferred to Malakas Street, and through the years, several structures were built. Today, the barangay hall already consists of two buildings.</p>
              <br />
              <p>The barangay is composed of seven (7) areas. Among them, Area 7 is the largest. The name Pinyahan was derived from the abundance of pineapple plants that once thrived in the area. Another distinct feature of the barangay is that all its streets begin with the letter M.</p>
              <br />
              <p>To this day, Barangay Pinyahan carries its colorful history and continues to nurture its identity as a community built on unity, hard work, and compassion.</p>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <img src="/images/brgypinyahanseal.jpg" alt="Official Seal"
                className="max-w-full h-auto rounded-lg shadow-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="w-[90%] max-w-[1200px] mx-auto pb-8">
        <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
            <div className="flex-1 flex justify-center">
              <img src="https://placehold.co/500x350?text=Mission+Vision+Values" alt="Mission Vision"
                className="max-w-full h-auto rounded-lg shadow-md" />
            </div>
            <div className="flex-1 md:pl-5">
              <div className="mb-8">
                <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-2.5">MISSION:</h3>
                <p className="text-sm md:text-base text-gray-700 mb-2">To provide the general welfare of barangay residents, where:</p>
                <ul className="list-disc pl-5 space-y-2.5 text-sm md:text-base text-gray-700">
                  <li>Punong barangay, council, and staff deliver responsive, efficient and timely basic services.</li>
                  <li>Support better healthcare, ensure and support quality education.</li>
                  <li>Empower citizens of every gender and social class; promote a safe, orderly, and sustainable community.</li>
                  <li>Barangay residents and other stakeholders are actively engage and share responsibility for developing a quality community.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-2.5">VISION:</h3>
                <p className="text-sm md:text-base text-gray-700">We envision Barangay Pinyahan as a quality community for all.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Org Chart */}
      <section className="bg-[#eef5ff] py-10">
        <div className="w-[90%] max-w-[1200px] mx-auto bg-white shadow-md rounded-lg p-6 md:p-8">
          <h3 className="text-xl md:text-[1.8rem] font-extrabold text-gray-800 uppercase mb-6 text-center">ORGANIZATIONAL CHART</h3>
          <div className="flex flex-col items-center gap-8 pt-8">
            {/* Top */}
            <div className="flex justify-center gap-6 md:gap-10 w-full">
              <OrgCard />
            </div>
            {/* Connector */}
            <div className="w-0.5 h-10 bg-gray-300 mx-auto -mb-5" />
            {/* Mid */}
            <div className="flex justify-center gap-6 md:gap-10 w-full">
              <OrgCard /><OrgCard />
            </div>
            {/* Bottom */}
            <div className="flex justify-center gap-4 md:gap-10 w-full flex-wrap">
              <OrgCard /><OrgCard /><OrgCard /><OrgCard /><OrgCard />
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function OrgCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 w-24 h-24 md:w-[120px] md:h-[120px] flex justify-center items-center shadow-sm">
      <i className="fas fa-user text-4xl md:text-5xl text-[#0056b3]" />
    </div>
  );
}
