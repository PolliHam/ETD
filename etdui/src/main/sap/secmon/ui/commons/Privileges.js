jQuery.sap.declare("sap.secmon.ui.commons.Privileges");

/**
 * Some user privileges as returned by global model "applicationContext" (node "userPrivileges").
 * The model is backed by backend service "sap/secmon/services/common/ApplicationContext.xsjs".
 */
sap.secmon.ui.commons.Privileges = {
	
    // Common privileges, shared between objects
    LOG_DOWNLOAD: "logDownload",
    CONTENT_DOWNLOAD: "contentDownload",
    CONTENT_UPLOAD: "contentUpload",
    CONTENTREPLICATION_IMPORT: "contentRepImport",
    CONTENTREPLICATION_EXPORT: "contentRepExport",
    
    
    // specific privileges by object
    ORIGINALLOG_READ: "originalLogRead",
    NORMALIZEDLOG_READ: "normalizedLogRead", // i.e. the semantic event
    UNRECOGNIZEDLOG_READ: "unrecognizedLogRead",
    
    SYSTEM_READ: "systemRead",
    SYSTEM_WRITE: "systemWrite",
    
    VALUELIST_READ: "valuelistRead",
    VALUELIST_WRITE: "valuelistWrite",
    
    NAMESPACES_READ: "namespacesRead",
    NAMESPACES_WRITE: "namespacesWrite",
    
    WORKSPACE_READ: "workspaceRead",
    WORKSPACE_WRITE: "workspaceWrite",
    
    PATTERN_READ: "patternRead",
    PATTERN_WRITE: "patternWrite",
    
    ANOMALYDETECTION_READ: "anomalyDetectionRead",
    ANOMALYDETECTION_WRITE: "anomalyDetectionWrite",
    
    INVESTIGATION_READ: "investigationRead",
    INVESTIGATION_WRITE: "investigationWrite",
    
    ALERT_READ: "alertRead",
    ALERT_WRITE: "alertWrite",
    
    SNAPSHOT_READ: "snapshotRead",
    SNAPSHOT_WRITE: "snapshotWrite",
    
    CASEFILE_READ: "casefileRead",
    CASEFILE_WRITE: "casefileWrite",
    
    INVESTIGATIONTEMPLATE_READ: "investigationTemplateRead",
    INVESTIGATIONTEMPLATE_WRITE: "investigationTemplateWrite",
    
    KNOWLEDGEBASE_READ: "knowledgebaseRead",
    KNOWLEDGEBASE_WRITE: "knowledgebaseWrite",
    
    LOGLEARNINGRULE_READ: "logLearningRead",
    LOGLEARNINGRULE_WRITE: "logLearningWrite",
    
    EXEMPTION_READ: "exemptionRead",
    EXEMPTION_WRITE: "exemptionWrite",
    
    SUBNET_READ: "subnetRead",
    SUBNET_WRITE: "subnetWrite",
    
    LOCATION_READ: "locationRead",
    LOCATION_WRITE: "locationWrite",
    
    MONITORINGPAGE_READ: "monitoringPageRead",
    MONITORINGPAGE_WRITE: "monitoringPageWrite",
    
    SECURITYNOTE_READ: "securityNoteRead",
    
    DOMAINRATING_READ: "domainRatingRead",
    DOMAINRATING_WRITE: "domainRatingWrite",
    
    USER_RESOLVE: "resolveUser",
    
    PATTERNEXECUTIONRESULT_READ: "patternExecutionResultRead",
    
    // under discussion: Do we need fine-grained read access?
    SETTINGS_READ: "settingsRead",
    
    SETTINGS_MANAGEEVENTSTORAGE_WRITE: "settingsManageEventStorageWrite",
    SETTINGS_MANAGEALERTPUBLISHING_WRITE: "settingsManageAlertPublishingWrite",
    SETTINGS_PATTERNFILTER_WRITE: "settingsPatternFilterWrite",
    SETTINGS_CONTENTREPLICATION_WRITE: "settingsContentReplicationWrite",
    SETTINGS_TIMEZONE_WRITE: "settingsTimeZoneWrite",
    SETTINGS_ANOMALYDETECTION_WRITE: "settingsAnomalyDetectionWrite",
    SETTINGS_CUSTOMVALUES_WRITE: "settingsCustomValuesWrite",
    SETTINGS_WORKLOADMANAGER_WRITE: "settingsWorkloadManagerWrite",
    
    isAuthorized: function(sPrivilege){
	var oModel = sap.secmon.ui.commons.Privileges.getAplicationContextModel.call(this);
	var oPrivileges = oModel.getObject("/userPrivileges");
	return oPrivileges[sPrivilege] === true;
    },
    
    /**
     * get the applicationContext model that is available to all views and their corresponding controllers
     * under the EtdComponent.
     * @returns
     */
    getAplicationContextModel: function(){
	var oModel = null;
	
	if (this.getView){
	    // "this" is a controller
	    oModel = this.getView().getModel("applicationContext");
	} else if (this.getModel){
	    // "this" is a view
	    oModel = this.getModel("applicationContext");
	} else {
	    throw "Programming error. This function must be called from a controller or a view.";
	}
	return oModel;
    }
};