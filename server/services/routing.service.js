/**
 * Routing Service — Dynamic Hierarchical Approval Engine
 *
 * Determines the approval chain based on request type + sub-type metadata.
 * Returns an array of role strings in approval order.
 */

const ROUTING_RULES = {
    duty_leave_upload: ['tutor'],
    duty_leave_dept: ['tutor', 'hod', 'principal'],
    duty_leave_club: ['faculty_coordinator', 'principal'],
    duty_leave_external: ['tutor', 'hod', 'principal'],
    scholarship: ['tutor', 'hod', 'principal'],
    event_conduct_club: ['faculty_coordinator', 'principal'],
    event_conduct_dept: ['hod', 'principal'],
    general_certificate: ['tutor', 'hod', 'principal'],
    borrow_certificate: ['tutor', 'hod', 'principal'],
    season_ticket: ['tutor', 'hod'],
    fee_structure: ['tutor', 'hod', 'principal'],
};

/**
 * Determine approval chain from request type + formData.
 * @param {string} type - The request type key
 * @param {object} formData - The submitted form data
 * @returns {string[]} - Ordered array of role identifiers
 */
function determineApprovalChain(type, formData) {
    // Duty Leave has sub-types determined by eventType field
    if (type === 'duty_leave_event') {
        const eventType = formData.eventType || '';
        const community = (formData.communityName || '').toLowerCase();

        if (eventType === 'Community-Club') {
            return ROUTING_RULES.duty_leave_club;
        }
        if (eventType === 'Inter-college' || eventType === 'Other') {
            return ROUTING_RULES.duty_leave_external;
        }
        // Department event
        return ROUTING_RULES.duty_leave_dept;
    }

    // Event Conduct Permission — sub-type by organisation
    if (type === 'event_conduct') {
        const org = (formData.organisationName || '').toLowerCase();
        if (org === 'department') return ROUTING_RULES.event_conduct_dept;
        return ROUTING_RULES.event_conduct_club;
    }

    return ROUTING_RULES[type] || ['tutor'];
}

/**
 * Find the next authority user for a request.
 * @param {object} request - Mongoose Request document
 * @param {object} User - User model
 * @returns {Promise<object|null>} - The next authority User document or null
 */
async function findNextAuthority(request, User) {
    const chain = request.approvalChain;
    const step = request.currentStep;
    if (step >= chain.length) return null;

    const role = chain[step];

    // Match faculty_coordinator by assigned clubs/community
    if (role === 'faculty_coordinator') {
        const community = request.formData?.communityName || request.formData?.organisationName || '';
        const authority = await User.findOne({
            role: 'faculty_coordinator',
            assignedClubs: { $regex: new RegExp(community, 'i') },
        });
        if (authority) return authority;
        throw new Error(`No Faculty Coordinator assigned for ${community || 'this club'}. Please contact admin.`);
    }

    if (role === 'hod') {
        // Match HOD by student's department if available
        const dept = request.formData?.branch || request.formData?.department;
        if (dept) {
            const hod = await User.findOne({ role: 'hod', department: dept });
            if (hod) return hod;
        }
        return User.findOne({ role: 'hod' });
    }

    if (role === 'tutor') {
        // Match tutor by student's department AND their specific year batch
        const dept = request.formData?.branch || request.formData?.department;
        const yearOfStudy = request.formData?.yearOfStudy ? Number(request.formData.yearOfStudy) : undefined;

        if (dept && yearOfStudy) {
            // Best match: same department AND same assigned year
            const tutor = await User.findOne({ role: 'tutor', department: dept, assignedYear: yearOfStudy });
            if (tutor) return tutor;
        }
        if (dept) {
            // Fallback 1: right department, any year
            const tutor = await User.findOne({ role: 'tutor', department: dept });
            if (tutor) return tutor;
        }
        // Fallback 2: any tutor
        return User.findOne({ role: 'tutor' });
    }

    // principal
    return User.findOne({ role });
}

module.exports = { determineApprovalChain, findNextAuthority };
