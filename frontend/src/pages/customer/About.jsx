import { motion } from 'framer-motion';
import { FaShieldAlt, FaHeart, FaUsers, FaRocket, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';

const About = () => {
  const values = [
    { icon: <FaShieldAlt className="text-primary-500" />, title: 'Trust & Safety', desc: 'Every professional is background-verified and trained before joining our platform.' },
    { icon: <FaHeart className="text-red-500" />, title: 'Customer First', desc: 'We obsess over customer satisfaction and go the extra mile every single time.' },
    { icon: <FaUsers className="text-emerald-500" />, title: 'Community', desc: 'We empower local service professionals to build sustainable livelihoods.' },
    { icon: <FaRocket className="text-secondary-500" />, title: 'Innovation', desc: 'Leveraging technology to make home services seamless and affordable.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.15),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white/90 mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
              Our Story
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Making Homes <span className="text-secondary-400">Better</span>,<br /> One Service at a Time
            </h1>
            <p className="text-blue-100 mt-6 text-lg md:text-xl max-w-2xl mx-auto">
              We're on a mission to connect homeowners with trusted service professionals, creating a world where quality home services are just a tap away.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="section-title">Our Mission</h2>
              <p className="text-gray-600 mt-4 leading-relaxed">
                HomeFix was born from a simple observation — finding reliable home service professionals shouldn't be so hard. Too many homeowners struggle with unverified workers, inconsistent pricing, and unreliable service.
              </p>
              <p className="text-gray-600 mt-4 leading-relaxed">
                We built HomeFix to change that. Our platform connects you with <strong>verified, trained professionals</strong> who deliver quality work at transparent prices. Every provider on our platform goes through a rigorous background check and skill assessment.
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                {['Background Verified', 'Trained Professionals', 'Transparent Pricing', 'Quality Guaranteed'].map((item) => (
                  <span key={item} className="flex items-center gap-2 text-sm text-gray-700 bg-primary-50 px-4 py-2 rounded-full">
                    <FaCheckCircle className="text-primary-500 text-xs" /> {item}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-2 gap-4">
              {[
                { value: '10K+', label: 'Happy Customers', color: 'from-primary-500 to-primary-600' },
                { value: '500+', label: 'Service Providers', color: 'from-emerald-500 to-emerald-600' },
                { value: '25K+', label: 'Jobs Completed', color: 'from-secondary-500 to-secondary-600' },
                { value: '7+', label: 'Cities Served', color: 'from-purple-500 to-purple-600' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="card p-6 text-center hover:shadow-lg transition-shadow">
                  <p className="text-3xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="section-title">Our Values</h2>
            <p className="section-subtitle">The principles that drive everything we do</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-xl mx-auto">{v.icon}</div>
                <h3 className="font-semibold text-gray-900 mt-4">{v.title}</h3>
                <p className="text-sm text-gray-500 mt-2">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-white/5" />
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold">Ready to experience HomeFix?</h3>
              <p className="text-blue-100 mt-3">Join 10,000+ homeowners who trust HomeFix for their home services.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <a href="/services" className="bg-white text-primary-600 px-8 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors shadow-lg">
                  Browse Services
                </a>
                <a href="/register?role=provider" className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors border border-white/20">
                  Become a Provider
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
