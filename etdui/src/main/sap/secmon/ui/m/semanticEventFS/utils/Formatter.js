jQuery.sap.declare("sap.secmon.ui.m.semanticEventFS.utils.Formatter");

/**
 * Make some formatters globally available.
 */
sap.secmon.ui.m.semanticEventFS.utils.Formatter = {

    userSummarizer : function(sInitiating, sActing, sTargeted, sTargeting) {
        var s = '';
        var userRoleMap = {};
        var roles;
        if (sInitiating && sInitiating.length > 0) {
            var sInitiatingTransl = this.getModel("i18n").getProperty("InitiatingCOL");
            userRoleMap[sInitiating] = [ sInitiatingTransl ];
        }
        if (sActing && sActing.length > 0) {
            roles = userRoleMap[sActing];
            var sActingTransl = this.getModel("i18n").getProperty("ActingCOL");
            if (roles) {
                roles.push(sActingTransl);
            } else {
                userRoleMap[sActing] = [ sActingTransl ];
            }
        }
        if (sTargeted && sTargeted.length > 0) {
            roles = userRoleMap[sTargeted];
            var sTargetedTransl = this.getModel("i18n").getProperty("TargetedCOL");
            if (roles) {
                roles.push(sTargetedTransl);
            } else {
                userRoleMap[sTargeted] = [ sTargetedTransl ];
            }
        }
        if (sTargeting && sTargeting.length > 0) {
            roles = userRoleMap[sTargeting];
            var sTargetingTransl = this.getModel("i18n").getProperty("TargetingCOL");
            if (roles) {
                roles.push(sTargetingTransl);
            } else {
                userRoleMap[sTargeting] = [ sTargetingTransl ];
            }
        }
        var first = true;
        for ( var user in userRoleMap) {
            if (first === false) {
                s += ', ';
            }
            first = false;
            s += user + ' (';
            roles = userRoleMap[user];
            for (var index = 0; index < roles.length; index++) {
                if (index > 0) {
                    s += ', ';
                }
                s += roles[index];
            }
            s += ')';
        }
        return s;
    },

    systemSummarizer : function(sIdActor, sTypeActor, sIdInitiator, sTypeInitiator, sIdIntermediary, sTypeIntermediary, sIdReporter, sTypeReporter, sIdTarget, sTypeTarget) {
        var s = '';
        var sysWithType = '';
        var roles;
        var systemRoleMap = {};
        if (sIdActor && sIdActor.length > 0) {
            sysWithType = sIdActor;
            if (sTypeActor && sTypeActor.length > 0) {
                sysWithType += '(' + sTypeActor + ')';
            }
            var sActingTransl = this.getModel("i18n").getProperty("ActorCOL");
            systemRoleMap[sysWithType] = [ sActingTransl ];
        }
        if (sIdInitiator && sIdInitiator.length > 0) {
            sysWithType = sIdInitiator;
            if (sTypeInitiator && sTypeInitiator.length > 0) {
                sysWithType += '(' + sTypeInitiator + ')';
            }
            roles = systemRoleMap[sysWithType];
            var sInitiatingTransl = this.getModel("i18n").getProperty("InitiatorCOL");
            if (roles) {
                roles.push(sInitiatingTransl);
            } else {
                systemRoleMap[sysWithType] = [ sInitiatingTransl ];
            }
        }
        if (sIdIntermediary && sIdIntermediary.length > 0) {
            sysWithType = sIdIntermediary;
            if (sTypeIntermediary && sTypeIntermediary.length > 0) {
                sysWithType += '(' + sTypeIntermediary + ')';
            }
            roles = systemRoleMap[sysWithType];
            var sIntermediaryTransl = this.getModel("i18n").getProperty("IntermediaryCOL");
            if (roles) {
                roles.push(sIntermediaryTransl);
            } else {
                systemRoleMap[sysWithType] = [ sIntermediaryTransl ];
            }
        }
        if (sIdReporter && sIdReporter.length > 0) {
            sysWithType = sIdReporter;
            if (sTypeReporter && sTypeReporter.length > 0) {
                sysWithType += '(' + sTypeReporter + ')';
            }
            roles = systemRoleMap[sysWithType];
            var sReportingTransl = this.getModel("i18n").getProperty("ReportingCOL");
            if (roles) {
                roles.push(sReportingTransl);
            } else {
                systemRoleMap[sysWithType] = [ sReportingTransl ];
            }
        }
        if (sIdTarget && sIdTarget.length > 0) {
            sysWithType = sIdTarget;
            if (sTypeTarget && sTypeTarget.length > 0) {
                sysWithType += '(' + sTypeTarget + ')';
            }
            roles = systemRoleMap[sysWithType];
            var sTargetTransl = this.getModel("i18n").getProperty("TargetCOL");
            if (roles) {
                roles.push(sTargetTransl);
            } else {
                systemRoleMap[sysWithType] = [ sTargetTransl ];
            }
        }
        var first = true;
        for ( var system in systemRoleMap) {
            if (first === false) {
                s += ', ';
            }
            first = false;
            s += system + ' (';
            roles = systemRoleMap[system];
            for (var index = 0; index < roles.length; index++) {
                if (index > 0) {
                    s += ', ';
                }
                s += roles[index];
            }
            s += ')';
        }
        return s;
    },

    serviceSummarizer : function(sTransaction, sProgram) {
        var s = '';
        if (sTransaction && sTransaction.length > 0) {
            var sTransactionTransl = this.getModel("i18n").getProperty("TransactionCOL");
            s += sTransaction + ' (' + sTransactionTransl + ')';
        }
        if (sProgram && sProgram.length > 0) {
            if (s.length > 0) {
                s += ', ';
            }
            var sProgramTransl = this.getModel("i18n").getProperty("ProgramCOL");
            s += sProgram + ' (' + sProgramTransl + ')';
        }
        return s;
    },

};