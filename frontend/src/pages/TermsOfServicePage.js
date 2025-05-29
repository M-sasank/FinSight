import React from 'react';
import './InfoPage.css'; // We'll create this CSS file next

function TermsOfServicePage() {
    return (
        <div className="info-page-container">
            <div className="info-page-card">
                <h1 className="info-page-title">Terms of Service</h1>
                <div className="info-page-content">
                    <p><strong>Last Updated: May 21, 2025</strong></p>

                    <p>Welcome to FinSight! These Terms of Service ("Terms") govern your access to and use of the FinSight application and services ("Service"), provided by the FinSight Team ("we," "us," or "our"). By accessing or using our Service, you agree to be bound by these Terms.</p>

                    <h2>1. Our Service</h2>
                    <p>FinSight is an intelligent personal finance advisor designed to provide insights and tools for managing personal finances. It leverages the Sonar API to offer real-time, reasoning-backed analysis and recommendations. Our goal is to help first-time investors and young professionals build a strong financial foundation.</p>
                    <p>Features include real-time stock analysis, financial news summaries, and market sentiment analysis. The Service is intended for informational and educational purposes only.</p>

                    <h2>2. Eligibility</h2>
                    <p>You must be at least 18 years old to use the Service. By agreeing to these Terms, you represent and warrant that you meet this age requirement.</p>
                    
                    <h2>3. User Accounts</h2>
                    <p>If you create an account with FinSight, you are responsible for maintaining the security of your account and for all activities that occur under the account. You must notify us immediately of any unauthorized uses of your account or any other breaches of security.</p>

                    <h2>4. Acceptable Use</h2>
                    <p>You agree not to use the Service for any unlawful purpose or in any way that could harm, disable, overburden, or impair the Service. This includes, but is not limited to:</p>
                    <ul>
                        <li>Attempting to gain unauthorized access to the Service or its related systems or networks.</li>
                        <li>Interfering with any other party's use and enjoyment of the Service.</li>
                        <li>Uploading or transmitting viruses or any other type of malicious code.</li>
                    </ul>

                    <h2>5. Financial Disclaimers</h2>
                    <p><strong>FinSight is not a financial advisor, broker, or dealer. The information provided by the Service is for informational and educational purposes only and should not be considered financial, investment, legal, or tax advice.</strong></p>
                    <p>We do not guarantee the accuracy, completeness, or timeliness of any information provided by the Service. You are solely responsible for your investment decisions and any consequences arising from them. Always conduct your own research and consult with a qualified financial professional before making any financial decisions.</p>

                    <h2>6. Intellectual Property</h2>
                    <p>The Service and its original content (excluding content provided by users or third parties like the Sonar API), features, and functionality are and will remain the exclusive property of the FinSight Team and its licensors. The Service is protected by copyright, trademark, and other laws.</p>

                    <h2>7. Third-Party Services</h2>
                    <p>FinSight utilizes the Sonar API from Perplexity to provide its core features. Your use of these features may also be subject to Perplexity's terms and policies. We are not responsible for the practices of any third-party services.</p>

                    <h2>8. Termination</h2>
                    <p>We may terminate or suspend your access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                    <p>Upon termination, your right to use the Service will immediately cease.</p>

                    <h2>9. Limitation of Liability</h2>
                    <p>In no event shall the FinSight Team, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.</p>

                    <h2>10. Changes to Terms</h2>
                    <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
                    <p>By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.</p>

                    <h2>11. Governing Law</h2>
                    <p>These Terms shall be governed and construed in accordance with the laws of [Specify Jurisdiction - e.g., State of California, USA], without regard to its conflict of law provisions.</p>

                    <h2>12. Contact Us</h2>
                    <p>If you have any questions about these Terms, please contact us at [Provide Contact Email or Method].</p>
                </div>
            </div>
        </div>
    );
}

export default TermsOfServicePage; 