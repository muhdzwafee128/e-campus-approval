const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const User = require('./models/User.model');
const RequestModel = require('./models/Request.model');
const ApprovalStep = require('./models/ApprovalStep.model');
const AuditLog = require('./models/AuditLog.model');

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('--- Migrating Users ---');
        // Find users with nodal_officer role
        const nodalOfficers = await User.find({ role: 'nodal_officer' });
        console.log(`Found ${nodalOfficers.length} users with role 'nodal_officer'.`);

        for (const user of nodalOfficers) {
            user.role = 'faculty_coordinator';
            if (!user.assignedClubs.includes('IEDC')) {
                user.assignedClubs.push('IEDC');
            }
            await user.save();
            console.log(`Migrated user: ${user.email}`);
        }

        console.log('--- Migrating Approval Steps ---');
        const updatedSteps = await ApprovalStep.updateMany(
            { role: 'nodal_officer' },
            { $set: { role: 'faculty_coordinator' } }
        );
        console.log(`Updated ${updatedSteps.modifiedCount} approval steps.`);

        console.log('--- Migrating Requests (Approval Chains) ---');
        // Find requests that have 'nodal_officer' in their approvalChain
        const requests = await RequestModel.find({ approvalChain: 'nodal_officer' });
        console.log(`Found ${requests.length} requests with 'nodal_officer' in their chain.`);
        
        let requestsUpdatedCount = 0;
        for (const req of requests) {
            const newChain = req.approvalChain.map(r => r === 'nodal_officer' ? 'faculty_coordinator' : r);
            req.approvalChain = newChain;
            await req.save();
            requestsUpdatedCount++;
        }
        console.log(`Updated ${requestsUpdatedCount} request document chains.`);
        
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

migrate();
