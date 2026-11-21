export const TERMS_VERSION = "2026-11-v1";

export interface TermsSection {
  number: number;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: {
    subtitle?: string;
    paragraphs?: string[];
    bullets?: string[];
  }[];
}

export const TERMS_METADATA = {
  platform: "CARBLINK.IN",
  documentTitle: "CUSTOMER TERMS & CONDITIONS",
  status: "Draft for legal review | Effective Date: [Insert Date]",
  platformOperator: "CarBlink Services Private Limited",
  website: "https://carblink.in",
  preamble: "By accessing, using, submitting a service request, or making a booking through CarBlink.in, the customer agrees to these Terms & Conditions."
};

export const TERMS_SECTIONS: TermsSection[] = [
  {
    number: 1,
    title: "Nature of CarBlink Platform",
    paragraphs: [
      "CarBlink Services Private Limited (\"CarBlink\", \"we\", \"our\", or \"us\") operates an online platform that facilitates customers in discovering, comparing, selecting, and booking automotive services offered by independent partner workshops.",
      "CarBlink acts as an intermediary and service aggregator. CarBlink does not itself own, operate, manage, or directly perform vehicle repairs, servicing, denting, painting, detailing, washing, mechanical work, or other automotive services unless expressly stated otherwise.",
      "Automotive services are performed by independent partner workshops selected by the customer through the platform."
    ]
  },
  {
    number: 2,
    title: "Price Comparison & Best Available Price",
    paragraphs: [
      "CarBlink enables customers to compare service quotations from multiple partner workshops and choose a suitable workshop based on price, service offerings, location, availability, customer preferences, and other relevant factors.",
      "CarBlink aims to help customers obtain quality automotive services at competitive and affordable prices.",
      "The lowest quotation displayed or communicated may depend upon the vehicle, service requirements, workshop availability, inspection findings, applicable taxes, parts, materials, and other conditions.",
      "CarBlink does not guarantee that the displayed price will be the lowest price available throughout the entire market."
    ]
  },
  {
    number: 3,
    title: "Partner Workshops",
    paragraphs: [
      "Partner workshops are independent third-party service providers.",
      "The customer acknowledges that:"
    ],
    bullets: [
      "The workshop is independently responsible for performing the automotive service.",
      "The workshop is responsible for its employees, technicians, premises, equipment, tools, licenses, workmanship, and service operations.",
      "CarBlink does not employ the technicians or staff of partner workshops.",
      "The customer and workshop may enter into a direct service relationship for the repair or maintenance of the vehicle."
    ]
  },
  {
    number: 4,
    title: "Booking & Confirmation",
    paragraphs: [
      "A booking request submitted through CarBlink does not automatically constitute a confirmed service appointment.",
      "A booking shall be considered confirmed when the customer receives confirmation through the platform, WhatsApp, SMS, email, telephone, or another official communication channel.",
      "The customer must provide accurate information regarding:"
    ],
    bullets: [
      "Vehicle make and model",
      "Vehicle registration details, where required",
      "Required service",
      "Vehicle condition",
      "Contact information",
      "Any relevant issue, damage, or special requirement"
    ],
    subsections: [
      {
        paragraphs: [
          "Incorrect or incomplete information may affect the quotation, availability, service outcome, or booking."
        ]
      }
    ]
  },
  {
    number: 5,
    title: "Quotations & Final Service Price",
    paragraphs: [
      "Quotes provided through CarBlink are based on the information available at the time of quotation.",
      "The partner workshop may require physical inspection of the vehicle before confirming the final scope and price.",
      "Any additional repair, replacement, labour, parts, material, or service charges not included in the approved quotation must be communicated to the customer and must receive the customer's approval before such additional work is undertaken.",
      "The workshop shall not impose undisclosed or unauthorized additional charges for work that was not approved by the customer.",
      "The customer may decline additional work and request clarification regarding the revised quotation."
    ]
  },
  {
    number: 6,
    title: "Booking Amount, Platform Fee & Payments",
    paragraphs: [
      "Customers may be required to pay a booking amount, advance payment, platform fee, or other amount displayed during the booking process.",
      "The applicable amount, payment method, payment recipient, and payment terms shall be disclosed before payment.",
      "Where the remaining service amount is payable directly to the partner workshop, the customer shall pay such amount directly to the workshop in accordance with the agreed quotation and service terms.",
      "CarBlink shall not be responsible for payments made directly to a workshop outside the platform, except to the extent required under applicable law.",
      "Customers must retain payment receipts, invoices, booking confirmations, and other transaction records."
    ]
  },
  {
    number: 7,
    title: "Cancellation & Refund Policy",
    paragraphs: [
      "Cancellation requests shall be governed by the cancellation terms displayed at the time of booking.",
      "Unless a different cancellation policy is expressly displayed for a particular booking:",
      "Cancellation before the customer visits or hands over the vehicle to the workshop:"
    ],
    bullets: [
      "10% of the booking amount may be retained as the applicable platform/processing fee, where disclosed at the time of booking.",
      "90% of the booking amount shall be eligible for refund."
    ],
    subsections: [
      {
        paragraphs: [
          "Refunds shall be processed through the original payment method or another permitted payment method, subject to payment gateway and banking timelines.",
          "Cancellation after the vehicle has been handed over, inspection has commenced, or work has started may be subject to the workshop's applicable charges, the services already performed, parts or materials purchased, and the disclosed booking terms.",
          "Customers should contact CarBlink support promptly to request cancellation."
        ]
      }
    ]
  },
  {
    number: 8,
    title: "Vehicle Handover & Workshop Custody",
    paragraphs: [
      "Upon handing over the vehicle to the partner workshop and the workshop accepting custody of the vehicle, the partner workshop shall be responsible for the vehicle's custody, care, safety, and security while the vehicle remains under its possession or control.",
      "The workshop shall take reasonable care of the vehicle and shall not use, drive, transfer, or otherwise operate the vehicle except as reasonably necessary for inspection, testing, repair, maintenance, or with the customer's consent.",
      "The workshop shall be responsible, subject to applicable law and the circumstances, for loss, theft, damage, unauthorized use, negligent handling, missing components, or incidents involving the vehicle occurring while the vehicle is under the workshop's custody or control.",
      "The customer should obtain a vehicle handover acknowledgement and ensure that the vehicle's condition, accessories, fuel level, and relevant existing damage are recorded where reasonably possible.",
      "CarBlink does not itself take physical custody of vehicles and shall not be directly responsible for incidents arising solely during the independent workshop's custody, subject to applicable law and CarBlink's own legal obligations."
    ]
  },
  {
    number: 9,
    title: "Personal Belongings & Valuables",
    paragraphs: [
      "Customers are advised to remove cash, jewellery, documents, electronic devices, personal belongings, valuables, and other unnecessary items from the vehicle before handing it over to a partner workshop.",
      "The customer should not leave valuable or sensitive items inside the vehicle.",
      "Responsibility for loss of personal belongings shall be determined according to the circumstances, applicable law, and the responsibility of the party having custody or control.",
      "CarBlink shall not be directly responsible for personal belongings left inside the vehicle merely because a booking was made through CarBlink."
    ]
  },
  {
    number: 10,
    title: "Repair Quality & Workmanship",
    paragraphs: [
      "All repair, maintenance, inspection, painting, detailing, washing, mechanical, electrical, and other automotive work is performed by the partner workshop.",
      "The partner workshop shall be responsible for:"
    ],
    bullets: [
      "Quality of workmanship",
      "Proper performance of the agreed service",
      "Use of appropriate parts and materials",
      "Safety-related workmanship",
      "Technical diagnosis",
      "Accuracy of repair recommendations",
      "Applicable service warranties or guarantees",
      "Correcting defects in its work where required by law or its warranty terms"
    ],
    subsections: [
      {
        paragraphs: [
          "Any warranty or guarantee on repair work, parts, materials, or services shall be provided by the workshop, manufacturer, supplier, or other responsible service provider, as applicable.",
          "CarBlink may assist in communicating service complaints to the workshop but does not independently guarantee repair outcomes unless expressly stated in writing."
        ]
      }
    ]
  },
  {
    number: 11,
    title: "Vehicle Condition, Inspection & Pre-Existing Issues",
    paragraphs: [
      "Customers must disclose known vehicle issues, warning lights, existing damage, modifications, mechanical defects, accident history, and relevant information that may affect the service.",
      "The workshop may conduct an inspection and identify additional issues not included in the original quotation.",
      "The customer acknowledges that certain repairs may reveal additional defects or complications due to the vehicle's age, condition, previous repairs, corrosion, accident history, modifications, or other factors.",
      "The workshop must communicate material additional work and charges for customer approval before proceeding, subject to emergency or legally permitted circumstances."
    ]
  },
  {
    number: 12,
    title: "Delays & Service Completion",
    paragraphs: [
      "Estimated completion times are indicative and may change due to:"
    ],
    bullets: [
      "Parts availability",
      "Additional inspection requirements",
      "Unexpected mechanical issues",
      "Workshop workload",
      "Customer approvals",
      "Technical complications",
      "Force majeure events"
    ],
    subsections: [
      {
        paragraphs: [
          "CarBlink may assist with communication regarding delays but does not control the independent workshop's operations or guarantee completion times unless expressly confirmed in writing."
        ]
      }
    ]
  },
  {
    number: 13,
    title: "Customer Responsibilities",
    paragraphs: [
      "The customer agrees to:"
    ],
    bullets: [
      "Provide accurate booking and vehicle information.",
      "Ensure lawful ownership or authority to submit the vehicle for service.",
      "Attend appointments or communicate changes promptly.",
      "Remove valuables and personal belongings.",
      "Review quotations and approve additional work.",
      "Make payments according to the agreed terms.",
      "Treat workshop employees and CarBlink representatives respectfully.",
      "Not misuse the platform or provide false, fraudulent, abusive, or misleading information."
    ]
  },
  {
    number: 14,
    title: "Workshop Responsibility & Customer–Workshop Relationship",
    paragraphs: [
      "The customer understands that the partner workshop is the actual service provider for automotive work.",
      "The customer may be required to sign a workshop job card, inspection form, service invoice, warranty document, or other service-related document directly with the workshop.",
      "The workshop shall be responsible for its service obligations, repair work, employees, vehicle custody, applicable licenses, taxes, invoices, and warranties.",
      "CarBlink facilitates the booking and communication process and does not become the manufacturer, repairer, mechanic, insurer, or owner of the vehicle solely by facilitating a booking.",
      "Nothing in these Terms shall exclude or restrict any liability that cannot legally be excluded under applicable law."
    ]
  },
  {
    number: 15,
    title: "Complaints & Customer Support",
    paragraphs: [
      "Customers may report booking-related concerns, pricing disputes, workshop issues, delays, service complaints, or other concerns to CarBlink through its official customer support channels.",
      "CarBlink may assist by:"
    ],
    bullets: [
      "Communicating with the partner workshop.",
      "Sharing booking-related information.",
      "Facilitating complaint resolution.",
      "Requesting clarification or supporting documents.",
      "Assisting in coordination between the customer and workshop."
    ],
    subsections: [
      {
        paragraphs: [
          "CarBlink does not guarantee a particular outcome in disputes involving independent workshops but will provide reasonable assistance in accordance with its platform processes and applicable law."
        ]
      }
    ]
  },
  {
    number: 16,
    title: "Limitation of Platform Responsibility",
    paragraphs: [
      "To the maximum extent permitted by applicable law, CarBlink shall not be responsible for acts, omissions, negligence, misconduct, service failures, repair defects, warranties, delays, theft, damage, accidents, or other events arising from the independent operations of partner workshops, except where liability arises from CarBlink's own acts, omissions, negligence, statutory obligations, or liability that cannot legally be excluded.",
      "Nothing in these Terms shall deprive a customer of rights available under applicable consumer protection laws."
    ]
  },
  {
    number: 17,
    title: "Platform Availability & Technical Issues",
    paragraphs: [
      "CarBlink may temporarily suspend, modify, restrict, or discontinue parts of the platform for maintenance, security, technical improvements, operational reasons, or other legitimate reasons.",
      "CarBlink does not guarantee uninterrupted, error-free, or continuous availability of the platform.",
      "Customers should not rely exclusively on the platform for emergency roadside assistance or emergency vehicle repairs unless such service is expressly offered."
    ]
  },
  {
    number: 18,
    title: "Fraud, Misuse & Prohibited Activities",
    paragraphs: [
      "Customers shall not:"
    ],
    bullets: [
      "Submit fraudulent bookings.",
      "Misrepresent vehicle details or service requirements.",
      "Attempt to manipulate quotations or platform operations.",
      "Harass workshops, employees, or other users.",
      "Use the platform for unlawful activities.",
      "Circumvent security or interfere with platform systems.",
      "Provide false reviews or knowingly misleading information."
    ],
    subsections: [
      {
        paragraphs: [
          "CarBlink may investigate suspected misuse and take reasonable action, including cancellation, restriction, suspension, or termination of platform access, subject to applicable law."
        ]
      }
    ]
  },
  {
    number: 19,
    title: "Privacy & Personal Information",
    paragraphs: [
      "CarBlink may collect and process customer information necessary for booking, quotation comparison, communication, payment processing, service facilitation, customer support, fraud prevention, legal compliance, and platform improvement.",
      "Information may be shared with partner workshops, payment providers, service providers, and other relevant parties to facilitate the requested service or where legally required.",
      "Customer information shall be handled in accordance with CarBlink's Privacy Policy and applicable data protection laws.",
      "Customers should refer to the Privacy Policy for details regarding information collection, use, sharing, retention, and applicable rights."
    ]
  },
  {
    number: 20,
    title: "Third-Party Services",
    paragraphs: [
      "The platform may use third-party payment gateways, communication services, maps, software providers, analytics services, or other integrations.",
      "CarBlink does not control all third-party services and shall not be responsible for their independent acts, omissions, outages, policies, or technical failures, except as required by applicable law."
    ]
  },
  {
    number: 21,
    title: "Reviews, Feedback & Content",
    paragraphs: [
      "Customers may submit reviews, ratings, feedback, photographs, or other content through the platform.",
      "Customers agree that submitted content shall not be unlawful, defamatory, fraudulent, abusive, misleading, infringing, or otherwise prohibited.",
      "CarBlink may moderate, remove, restrict, or investigate content where reasonably necessary and permitted by law."
    ]
  },
  {
    number: 22,
    title: "Force Majeure",
    paragraphs: [
      "CarBlink and partner workshops shall not be responsible for delays or failures caused by events beyond reasonable control, including natural disasters, severe weather, fire, government restrictions, strikes, war, civil unrest, epidemics, supply chain disruptions, power failures, telecommunications failures, or other force majeure events, subject to applicable law."
    ]
  },
  {
    number: 23,
    title: "Modification of Terms",
    paragraphs: [
      "CarBlink may update or modify these Terms from time to time to reflect changes in its platform, operations, business model, legal requirements, or services.",
      "Updated Terms shall be published on the platform with an updated effective date.",
      "Continued use of the platform after the updated Terms become effective shall constitute acceptance where legally permissible."
    ]
  },
  {
    number: 24,
    title: "Suspension or Termination",
    paragraphs: [
      "CarBlink may restrict or terminate access to the platform where reasonably necessary due to fraud, misuse, security concerns, violation of these Terms, legal requirements, or operational reasons.",
      "Termination shall not affect rights or obligations relating to bookings already confirmed, payments already made, refunds, disputes, or other matters that survive termination."
    ]
  },
  {
    number: 25,
    title: "Governing Law & Jurisdiction",
    paragraphs: [
      "These Terms shall be governed by the laws of India.",
      "Subject to applicable consumer protection laws and the jurisdiction of competent statutory authorities, disputes relating to these Terms shall be subject to the jurisdiction of competent courts at [Insert City/State of Registered Office].",
      "Nothing in these Terms shall restrict the customer's right to approach a competent consumer commission or other authority under applicable law."
    ]
  },
  {
    number: 26,
    title: "Grievance Redressal",
    paragraphs: [
      "For booking complaints, platform-related issues, refund requests, or grievances, customers may contact:",
      "Company: CarBlink Services Private Limited\nWebsite: https://carblink.in\nGrievance Officer: [Insert Name]\nEmail: [Insert Official Email]\nPhone: [Insert Support Number]\nRegistered Office: [Insert Registered Office Address]",
      "CarBlink shall acknowledge and address customer grievances within the timelines prescribed by applicable law."
    ]
  },
  {
    number: 27,
    title: "Acceptance",
    paragraphs: [
      "By clicking \"I Agree\", \"Accept Terms & Conditions\", proceeding with a booking, or making a payment through the platform, the customer confirms that they have read, understood, and agreed to these Terms & Conditions and the applicable booking-specific terms.",
      "If the customer does not agree with these Terms, they should not proceed with the booking or use the platform."
    ]
  }
];
