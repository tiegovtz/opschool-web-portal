<script setup lang="ts">
definePageMeta({
    title: 'Privacy Policy - EduAudio',
    description: 'Learn about our commitment to protecting your privacy and how we handle your data at EduAudio.',
})
</script>

<template>
    <nuxt-layout :name="$router.currentRoute.value.fullPath.includes('header-less') ? 'normal' : 'home-layout'">
        <section id="main-container" tabindex="-1" class="flex w-full justify-center px-4 py-8 md:px-8">
            <div class="w-full max-w-5xl">
                <header class="mb-8">
                    <h1 class="mt-2 text-2xl font-bold text-deepBlue md:text-3xl">
                        Privacy Policy
                    </h1>
                    <p class="mt-1 text-sm">
                        TIE Online School App
                    </p>
                    <p class="mt-2 text-sm">
                       <span class="font-medium">Effective Date:</span> 2025
                    </p>
                </header>

                <div class="space-y-6 text-sm leading-7">
                    <p>
                        TIE Online School (“TIE”, “we”, “our”, or “us”) is committed to protecting the privacy and personal
                        data of all users of the TIE Online School App. This Privacy Policy explains how we collect, use,
                        store, and protect information when students, teachers, and education stakeholders access our
                        interactive learning materials and services.
                    </p>
                    <p>
                        By using the TIE Online School App, you agree to the practices described in this Privacy Policy.
                    </p>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">1. Information We Collect</h2>
                        <p class="mt-2">We may collect the following types of information:</p>

                        <h3 class="mt-4 font-semibold">a. Personal Information</h3>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Full name</li>
                            <li>Email address</li>
                            <li>Phone number</li>
                            <li>School or institution name</li>
                            <li>User role (student, teacher, administrator, stakeholder)</li>
                            <li>Username and login credentials</li>
                        </ul>

                        <h3 class="mt-4 font-semibold">b. Educational Information</h3>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Grade level or subject area</li>
                            <li>Course enrollment and learning progress</li>
                            <li>Assessment results and activity participation</li>
                            <li>Teacher feedback and learning interactions</li>
                        </ul>

                        <h3 class="mt-4 font-semibold">c. Technical Information</h3>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Device type and operating system</li>
                            <li>App usage data and interaction logs</li>
                            <li>IP address and approximate location</li>
                            <li>Date and time of access</li>
                        </ul>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">2. How We Use Information</h2>
                        <p class="mt-2">We use collected information to:</p>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Provide access to interactive learning materials</li>
                            <li>Manage user accounts and roles</li>
                            <li>Track learning progress and performance</li>
                            <li>Support teaching, assessment, and reporting</li>
                            <li>Improve app functionality and user experience</li>
                            <li>Communicate updates, notices, and educational content</li>
                            <li>Ensure system security and prevent misuse</li>
                        </ul>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">3. Children’s Privacy</h2>
                        <p class="mt-2">
                            The TIE Online School App is designed for educational use and may be used by minors under the
                            supervision of schools, teachers, or parents/guardians.
                        </p>
                        <ul class="mt-2 list-disc pl-5">
                            <li>We collect only the minimum information required for educational purposes</li>
                            <li>Student data is used strictly for learning, assessment, and support</li>
                            <li>We do not knowingly collect personal data for commercial purposes</li>
                        </ul>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">4. Data Sharing and Disclosure</h2>
                        <p class="mt-2">We do not sell, rent, or trade personal information. Information may be shared only:</p>
                        <ul class="mt-2 list-disc pl-5">
                            <li>With authorized school administrators and educators for academic purposes</li>
                            <li>With service providers who support app operations (under confidentiality agreements)</li>
                            <li>When required by law, regulation, or legal process</li>
                        </ul>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">5. Data Storage and Security</h2>
                        <p class="mt-2">We implement appropriate technical and organizational measures to protect data, including:</p>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Secure servers and access controls</li>
                            <li>Password protection and role-based access</li>
                            <li>Regular system monitoring and updates</li>
                        </ul>
                        <p class="mt-2">
                            While we take reasonable steps to safeguard information, no system is 100% secure.
                        </p>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">6. User Rights and Choices</h2>
                        <p class="mt-2">Depending on your role and applicable laws, you may have the right to:</p>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Access your personal information</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion or restriction of data</li>
                            <li>Withdraw consent where applicable</li>
                        </ul>
                        <p class="mt-2">
                            Requests can be made through your school administrator or by contacting us directly.
                        </p>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">7. Cookies and Analytics</h2>
                        <p class="mt-2">The app may use cookies or similar technologies to:</p>
                        <ul class="mt-2 list-disc pl-5">
                            <li>Maintain user sessions</li>
                            <li>Improve performance and usability</li>
                            <li>Understand usage patterns</li>
                        </ul>
                        <p class="mt-2">These technologies do not collect sensitive personal data.</p>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">8. Third-Party Links and Services</h2>
                        <p class="mt-2">
                            The app may contain links to third-party educational resources. We are not responsible for the
                            privacy practices of external platforms.
                        </p>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">9. Changes to This Privacy Policy</h2>
                        <p class="mt-2">
                            We may update this Privacy Policy from time to time. Any changes will be posted within the app
                            or on our official platform, with the updated effective date.
                        </p>
                    </div>

                    <div>
                        <h2 class="text-base font-semibold text-deepBlue">10. Contact Information</h2>
                        <p class="mt-2">For questions, concerns, or privacy-related requests, please contact:</p>
                        <div class="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                            <p class="font-semibold text-deepBlue">TIE Online School</p>
                            <p>Email: director.general@tie.go.tz</p>
                            <p>Phone: +255-735-041168</p>
                            <p>Address: Mikocheni Area, 132 Ali Hassan Mwinyi Road, 14112 DAR ES SALAAM.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </nuxt-layout>
</template>
