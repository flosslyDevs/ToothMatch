// Configuration data for the application
// This includes all static data that Flutter needs on startup

export async function getConfig() {
	return {
		status: 200,
		body: {
			// Privacy Policy HTML String
			privacyPolicy: `
				<h1>Privacy Policy</h1>
				<p>This is a placeholder privacy policy. Please replace with your actual privacy policy content.</p>
				<p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
			`,
			
			// Candidate Side Configurations
			candidate: {
				jobTitles: [
					"Dental Assistant",
					"Dental Hygienist", 
					"Dental Technician",
					"Dental Receptionist",
					"Dental Practice Manager",
					"Orthodontic Assistant",
					"Oral Health Therapist",
					"Dental Nurse",
					"Treatment Coordinator",
					"Dental Administrator"
				],
				
				jobCurrentStatus: [
					"Currently Employed",
					"Unemployed",
					"Student",
					"Freelancer",
					"Contractor",
					"Part-time",
					"Full-time",
					"Looking for Change"
				],
				
				education: [
					"High School",
					"Certificate III in Dental Assisting",
					"Certificate IV in Dental Assisting",
					"Diploma of Dental Technology",
					"Bachelor of Oral Health",
					"Bachelor of Dental Science",
					"Master of Dentistry",
					"PhD in Dental Science",
					"Other"
				],
				
				yearsOfExperience: [
					"0-1 years",
					"1-2 years", 
					"2-3 years",
					"3-5 years",
					"5-7 years",
					"7-10 years",
					"10-15 years",
					"15+ years"
				],
				
				workingSuperPower: [
					"Excellent Communication",
					"Attention to Detail",
					"Patient Care",
					"Technical Skills",
					"Problem Solving",
					"Team Leadership",
					"Time Management",
					"Multitasking",
					"Adaptability",
					"Stress Management"
				],
				
				favouriteWorkVibe: [
					"Fast-paced Environment",
					"Collaborative Team",
					"Independent Work",
					"Creative Freedom",
					"Structured Routine",
					"Learning Opportunities",
					"Patient Interaction",
					"Technical Challenges",
					"Flexible Schedule",
					"Professional Growth"
				],
				
				tacklingDifficultSituation: [
					"Stay Calm and Analyze",
					"Seek Help from Colleagues",
					"Follow Protocol",
					"Communicate Clearly",
					"Think Outside the Box",
					"Document Everything",
					"Prioritize Patient Safety",
					"Learn from Experience",
					"Maintain Professionalism",
					"Take Initiative"
				],
				
				roleBasedSkills: [
					"X-ray Operation",
					"Infection Control",
					"Patient Management",
					"Appointment Scheduling",
					"Insurance Processing",
					"Treatment Planning",
					"Laboratory Work",
					"Equipment Maintenance",
					"Record Keeping",
					"Emergency Procedures"
				],
				
				specialisations: [
					"General Dentistry",
					"Orthodontics",
					"Oral Surgery",
					"Periodontics",
					"Endodontics",
					"Prosthodontics",
					"Pediatric Dentistry",
					"Cosmetic Dentistry",
					"Implant Dentistry",
					"Geriatric Dentistry"
				],
				
				idealJobTitles: [
					"Senior Dental Assistant",
					"Lead Dental Hygienist",
					"Dental Practice Manager",
					"Treatment Coordinator",
					"Orthodontic Specialist",
					"Oral Health Educator",
					"Dental Consultant",
					"Clinical Supervisor",
					"Quality Assurance Manager",
					"Training Coordinator"
				],
				
				lookingFor: [
					"Private Practice",
					"Public Health",
					"Hospital Setting",
					"Corporate Dentistry",
					"Specialist Practice",
					"Mobile Dental Service",
					"Educational Institution",
					"Research Facility",
					"Government Agency",
					"Non-profit Organization"
				],
				
				jobTypes: [
					"Full-time",
					"Part-time",
					"Contract",
					"Casual",
					"Temporary",
					"Permanent",
					"Freelance",
					"Internship",
					"Volunteer",
					"Remote"
				],
				
				payRanges: [
					"$20,000 - $30,000",
					"$30,000 - $40,000",
					"$40,000 - $50,000",
					"$50,000 - $60,000",
					"$60,000 - $70,000",
					"$70,000 - $80,000",
					"$80,000 - $90,000",
					"$90,000 - $100,000",
					"$100,000+"
				],
				
				preferredWorkingPatterns: [
					"Monday to Friday",
					"Monday to Thursday",
					"Tuesday to Saturday",
					"Weekends Only",
					"Evening Shifts",
					"Morning Shifts",
					"Split Shifts",
					"Flexible Hours",
					"4-Day Work Week",
					"Rotating Schedule"
				],
				
				salaryPreferenceRange: {
					min: 0,
					max: 1000000,
					step: 1000
				}
			},
			
			// Practice Side Configurations
			practice: {
				typesOfClinics: [
					"General Practice",
					"Orthodontic Practice",
					"Oral Surgery Center",
					"Pediatric Dentistry",
					"Cosmetic Dentistry",
					"Implant Center",
					"Emergency Dental",
					"Mobile Dental Service",
					"Corporate Practice",
					"Specialist Practice"
				],
				
				documentsRequired: [
					"Resume/CV",
					"Cover Letter",
					"Professional References",
					"Certification Copies",
					"License Verification",
					"Background Check",
					"Immunization Records",
					"CPR Certification",
					"Professional Insurance",
					"Portfolio/Work Samples"
				],
				
				yearsOfExperience: [
					"0-1 years",
					"1-2 years",
					"2-3 years", 
					"3-5 years",
					"5-7 years",
					"7-10 years",
					"10-15 years",
					"15+ years"
				],
				
				skillsSoftwareRequired: [
					"Dental Practice Management Software",
					"X-ray Imaging Software",
					"Microsoft Office",
					"Digital Impression Systems",
					"CAD/CAM Software",
					"Patient Communication Tools",
					"Electronic Health Records",
					"Appointment Scheduling Systems",
					"Billing Software",
					"Laboratory Management"
				],
				
				benefitsOffered: [
					"Health Insurance",
					"Dental Coverage",
					"Retirement Plan",
					"Paid Time Off",
					"Professional Development",
					"Continuing Education",
					"Flexible Schedule",
					"Work from Home",
					"Gym Membership",
					"Transportation Allowance"
				],
				
				workLoad: [
					"Light (1-20 patients/day)",
					"Moderate (21-40 patients/day)",
					"Heavy (41-60 patients/day)",
					"Very Heavy (60+ patients/day)",
					"Variable",
					"Emergency Only",
					"Appointment Based",
					"Walk-in Heavy",
					"Specialist Focus",
					"Administrative Focus"
				]
			},
			
			// Job Creation Configurations
			jobCreation: {
				roles: [
					"Dental Assistant",
					"Dental Hygienist",
					"Dental Technician",
					"Dental Receptionist",
					"Dental Practice Manager",
					"Orthodontic Assistant",
					"Oral Health Therapist",
					"Dental Nurse",
					"Treatment Coordinator",
					"Dental Administrator",
					"Lab Technician",
					"Insurance Coordinator"
				],
				
				contractTypes: [
					"Permanent",
					"Contract",
					"Casual",
					"Temporary",
					"Part-time",
					"Full-time",
					"Fixed-term",
					"Probationary",
					"Internship",
					"Volunteer"
				],
				
				jobTypes: [
					"Full-time",
					"Part-time",
					"Contract",
					"Casual",
					"Temporary",
					"Permanent",
					"Freelance",
					"Internship",
					"Volunteer",
					"Remote"
				],
				
				experienceLevels: [
					"Entry Level",
					"Junior (1-2 years)",
					"Mid Level (3-5 years)",
					"Senior (6-10 years)",
					"Lead (10+ years)",
					"Manager Level",
					"Director Level",
					"Executive Level",
					"Any Level",
					"Graduate/New"
				],
				
				specialisms: [
					"General Dentistry",
					"Orthodontics",
					"Oral Surgery",
					"Periodontics",
					"Endodontics",
					"Prosthodontics",
					"Pediatric Dentistry",
					"Cosmetic Dentistry",
					"Implant Dentistry",
					"Geriatric Dentistry",
					"Emergency Dentistry",
					"Preventive Care"
				],
				
				salaryRanges: [
					"$20,000 - $30,000",
					"$30,000 - $40,000",
					"$40,000 - $50,000",
					"$50,000 - $60,000",
					"$60,000 - $70,000",
					"$70,000 - $80,000",
					"$80,000 - $90,000",
					"$90,000 - $100,000",
					"$100,000 - $120,000",
					"$120,000+"
				],
				
				benefits: [
					"Health Insurance",
					"Dental Coverage",
					"Vision Insurance",
					"Life Insurance",
					"Disability Insurance",
					"Retirement Plan (401k)",
					"Paid Time Off",
					"Sick Leave",
					"Professional Development",
					"Continuing Education",
					"Flexible Schedule",
					"Work from Home",
					"Gym Membership",
					"Transportation Allowance",
					"Meal Allowance",
					"Childcare Support"
				],
				
				workingHours: [
					"9 AM - 5 PM",
					"8 AM - 4 PM",
					"10 AM - 6 PM",
					"7 AM - 3 PM",
					"Flexible Hours",
					"Evening Shifts",
					"Morning Shifts",
					"Weekend Shifts",
					"Split Shifts",
					"On-call",
					"4-Day Work Week",
					"Part-time Hours"
				],
				
				interviewTypes: [
					"Phone Interview",
					"Video Interview",
					"In-person Interview",
					"Panel Interview",
					"Technical Interview",
					"Behavioral Interview",
					"Group Interview",
					"Assessment Center",
					"Practical Test",
					"Portfolio Review"
				]
			}
		}
	};
}
