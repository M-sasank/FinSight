import React from 'react';
import './InfoPage.css'; // Reuse the same CSS

function PrivacyPolicyPage() {
    return (
        <div className="info-page-container">
            <div className="info-page-card">
                <h1 className="info-page-title">Privacy Policy</h1>
                <div className="info-page-content">
                    <p><strong>Last Updated: [Insert Date]</strong></p>

                    <p>The FinSight Team ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our FinSight application and services ("Service"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the service.</p>

                    <h2>1. Information We Collect</h2>
                    <p>We may collect information about you in a variety of ways. The information we may collect via the Service includes:</p>
                    <ul>
                        <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Service or when you choose to participate in various activities related to the Service.</li>
                        <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Service, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Service. (Note: Clarify if this level of tracking is intended or active).</li>
                        <li><strong>Financial Data:</strong> FinSight, by its nature, may process information related to financial interests, stock symbols you track, or queries you make about financial topics via the Sonar API. We do not directly store your brokerage account credentials or full portfolio details unless a future feature for direct integration is implemented and you explicitly consent.</li>
                    </ul>

                    <h2>2. Use of Your Information</h2>
                    <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
                    <ul>
                        <li>Create and manage your account.</li>
                        <li>Provide you with the core functionalities of FinSight, including stock analysis and financial insights generated via the Sonar API.</li>
                        <li>Improve our Service and develop new features.</li>
                        <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                        <li>Respond to your comments, questions, and provide customer support.</li>
                        <li>Comply with legal obligations.</li>
                    </ul>

                    <h2>3. Disclosure of Your Information</h2>
                    <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                    <ul>
                        <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                        <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including data analysis, email delivery, hosting services, customer service, and marketing assistance. Our primary third-party service provider is Perplexity for the Sonar API, which processes your financial queries.</li>
                        <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                    </ul>
                    <p>We do not sell your personal information to third parties.</p>

                    <h2>4. Security of Your Information</h2>
                    <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

                    <h2>5. Data Processed by Sonar API</h2>
                    <p>When you use features powered by the Sonar API, your queries and related data are processed by Perplexity according to their terms and privacy policies. We encourage you to review Perplexity's policies to understand how they handle your data.</p>

                    <h2>6. Your Choices Regarding Your Information</h2>
                    <p>You may at any time review or change the information in your account or terminate your account by:</p>
                    <ul>
                        <li>Logging into your account settings and updating your account.</li>
                        <li>Contacting us using the contact information provided below.</li>
                    </ul>
                    <p>Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our Terms of Service and/or comply with legal requirements.</p>

                    <h2>7. Policy for Children</h2>
                    <p>We do not knowingly solicit information from or market to children under the age of 13. If we learn that we have collected personal information from a child under age 13 without verification of parental consent, we will delete that information as quickly as possible. If you become aware of any data we have collected from children under age 13, please contact us.</p>

                    <h2>8. Changes to This Privacy Policy</h2>
                    <p>We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

                    <h2>9. Contact Us</h2>
                    <p>If you have questions or comments about this Privacy Policy, please contact us at: [Provide Contact Email or Method]</p>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicyPage; 