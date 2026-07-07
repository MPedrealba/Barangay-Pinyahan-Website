'use client';
import PublicShell from '@/components/PublicShell';

export default function AboutPage() {
  return (
    <PublicShell activeHref="/about">
      {/* Hero Full */}
      <section style={{ overflow: 'hidden', background: '#003366' }}>
        <img src="https://placehold.co/1200x500?text=Barangay+Multi-Purpose+Hall" alt="Barangay Hall"
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 520, objectFit: 'cover' }} />
      </section>

      {/* History */}
      <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', padding: '30px 0' }}>
        <div style={{ backgroundColor: 'white', boxShadow: '0 0 15px rgba(0,0,0,0.1)', borderRadius: 8, padding: 30 }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25 }}>BARANGAY HISTORY</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40 }}>
            <div style={{ flex: 2, lineHeight: 1.8, textAlign: 'justify' }}>
              <p>Barangay Pinyahan was originally located along Malakas Street. Back then, the barangay watchmen or tanods were simply called volunteers as they served without expecting anything in return. Eventually, the barangay hall was transferred to Malakas Street, and through the years, several structures were built. Today, the barangay hall already consists of two buildings.</p>
              <br />
              <p>The barangay is composed of seven (7) areas. Among them, Area 7 is the largest. The name Pinyahan was derived from the abundance of pineapple plants that once thrived in the area. Another distinct feature of the barangay is that all its streets begin with the letter M.</p>
              <br />
              <p>To this day, Barangay Pinyahan carries its colorful history and continues to nurture its identity as a community built on unity, hard work, and compassion.</p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src="/images/Brgy._Pinyahan_Seal.png" alt="Official Seal"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ width: '90%', maxWidth: 1200, margin: '0 auto', padding: '0 0 30px' }}>
        <div style={{ backgroundColor: 'white', boxShadow: '0 0 15px rgba(0,0,0,0.1)', borderRadius: 8, padding: 30 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 40 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <img src="https://placehold.co/500x350?text=Mission+Vision+Values" alt="Mission Vision"
                style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ flex: 1, paddingLeft: 20 }}>
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ fontSize: '1.5em', color: '#333', marginBottom: 10 }}>MISSION:</h3>
                <p>To provide the general welfare of barangay residents, where:</p>
                <ul style={{ listStyleType: 'disc', paddingLeft: 20 }}>
                  {[
                    'Punong barangay, council, and staff deliver responsive, efficient and timely basic services.',
                    'Support better healthcare, ensure and support quality education.',
                    'Empower citizens of every gender and social class; promote a safe, orderly, and sustainable community.',
                    'Barangay residents and other stakeholders are actively engage and share responsibility for developing a quality community.',
                  ].map((item, i) => <li key={i} style={{ marginBottom: 10 }}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5em', color: '#333', marginBottom: 10 }}>VISION:</h3>
                <p>We envision Barangay Pinyahan as a quality community for all.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Org Chart */}
      <section style={{ backgroundColor: '#eef5ff', padding: '40px 0' }}>
        <div style={{ width: '90%', maxWidth: 1200, margin: '0 auto', backgroundColor: 'white', boxShadow: '0 0 15px rgba(0,0,0,0.1)', borderRadius: 8, padding: 30 }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#333', textTransform: 'uppercase', marginBottom: 25, textAlign: 'center' }}>ORGANIZATIONAL CHART</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, paddingTop: 30 }}>
            {/* Top */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, width: '100%' }}>
              <OrgCard />
            </div>
            {/* Connector */}
            <div style={{ width: 2, height: 40, backgroundColor: '#ccc', margin: '0 auto -20px' }}></div>
            {/* Mid */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, width: '100%' }}>
              <OrgCard /><OrgCard />
            </div>
            {/* Bottom */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, width: '100%', flexWrap: 'wrap' }}>
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
    <div style={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: 8, padding: 20, width: 120, height: 120, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <i className="fas fa-user" style={{ fontSize: '3em', color: '#0056b3' }}></i>
    </div>
  );
}
