const PrivacyPage = () => {
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl max-w-2xl mx-auto">
              We respect your privacy and are committed to protecting your personal data.
            </p>
          </div>
        </div>
        
        {/* Privacy Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
            <div className="prose max-w-none">
              <p className="text-gray-600">
                Last Updated: April 28, 2025
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Introduction</h2>
              <p>
                At EventHub, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, process, and store your data when you use our website and services.
              </p>
              <p>
                Please read this Privacy Policy carefully to understand our practices regarding your personal data.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Data We Collect</h2>
              <p>
                We may collect the following types of information:
              </p>
              <ul className="list-disc pl-5 mt-2 mb-4">
                <li><strong>Personal Identification Information:</strong> Name, email address, phone number, postal address.</li>
                <li><strong>Account Information:</strong> Username, password, account preferences.</li>
                <li><strong>Transaction Information:</strong> Payment details, purchase history, billing information.</li>
                <li><strong>Technical Information:</strong> IP address, browser type, device information, cookies.</li>
                <li><strong>Usage Information:</strong> How you use our website, which pages you visit, and which features you use.</li>
                <li><strong>Location Information:</strong> If you grant permission, we collect your precise location to help you find events near you.</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Data</h2>
              <p>
                We use your personal data for the following purposes:
              </p>
              <ul className="list-disc pl-5 mt-2 mb-4">
                <li>To create and manage your account</li>
                <li>To process and fulfill your ticket purchases</li>
                <li>To provide customer support</li>
                <li>To send you important information about your purchases and our services</li>
                <li>To improve our website and services</li>
                <li>To send you marketing communications (if you have opted in)</li>
                <li>To prevent fraud and ensure the security of our platform</li>
                <li>To comply with legal obligations</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Legal Basis for Processing</h2>
              <p>
                We process your personal data on the following legal grounds:
              </p>
              <ul className="list-disc pl-5 mt-2 mb-4">
                <li><strong>Contract:</strong> Processing is necessary for the performance of our contract with you.</li>
                <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate business interests.</li>
                <li><strong>Consent:</strong> You have given consent for specific processing activities.</li>
                <li><strong>Legal Obligation:</strong> Processing is necessary to comply with our legal obligations.</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Sharing</h2>
              <p>
                We may share your personal data with:
              </p>
              <ul className="list-disc pl-5 mt-2 mb-4">
                <li><strong>Service Providers:</strong> Companies that provide services on our behalf, such as payment processing, data analysis, and customer support.</li>
                <li><strong>Event Organizers:</strong> To facilitate your attendance at events.</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights.</li>
              </ul>
              <p>
                We do not sell your personal data to third parties.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal data from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Data Retention</h2>
              <p>
                We retain your personal data for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">8. Your Data Protection Rights</h2>
              <p>
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-5 mt-2 mb-4">
                <li>The right to access your personal data</li>
                <li>The right to rectify inaccurate personal data</li>
                <li>The right to erasure (the "right to be forgotten")</li>
                <li>The right to restrict processing</li>
                <li>The right to data portability</li>
                <li>The right to object to processing</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p>
                To exercise your rights, please contact us using the information provided in the "Contact Us" section.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">9. Cookies and Similar Technologies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience on our website, analyze how our website is used, and personalize content. You can manage your cookie preferences through your browser settings.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">10. Children's Privacy</h2>
              <p>
                Our services are not intended for children under the age of 16, and we do not knowingly collect personal data from children under 16. If you become aware that a child has provided us with personal data, please contact us.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">11. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website or by sending you an email. Your continued use of our services after such changes constitutes your acceptance of the new Privacy Policy.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at braconieruvalica99@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default PrivacyPage;