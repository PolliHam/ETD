/**
 * Some constants for accessing ODATA services.
 */
jQuery.sap.declare("sap.secmon.ui.m.commons.ServiceConstants");

sap.secmon.ui.m.commons.ServiceConstants = {
    /**
     * The alerts ODATA service returns a list of alerts. The returned metadata (attributes) are taken from the DB view "sap.secmon.db::AlertHeaderPatternView".
     */
    'ALERTS_SERVICE' : '/sap/secmon/services/patterndefinitionToAlerts.xsodata/Alerts',

    /**
     * The investigations ODATA service returns a list of investigations. The returned metadata (attributes) are taken from the DB table "sap.secmon.db::Investigation.Investigation".
     */
    'INVESTIGATIONS_SERVICE' : '/sap/secmon/services/ui/m/invest/investigation.xsodata/Investigation',

    /**
     * The investigation templates ODATA service returns a list of investigation templates. The returned metadata (attributes) are taken from the DB table
     * "sap.secmon.db::Investigation.InvestigationTemplate".
     */
    'INVESTIGATIONTEMPLATES_SERVICE' : '/sap/secmon/services/ui/m/invest/investigation.xsodata/InvestigationTemplate',

    /**
     * The patterns ODATA service returns a list of patterns. The returned metadata (attributes) are taken from the DB view "sap.secmon.db::AlertCountPerPatternView"
     */
    'PATTERNS_SERVICE' : '/sap/secmon/services/patterndefinitionToAlerts.xsodata/PatternDefinition',

    /**
     * The exemption ODATA service returns a list of exemptions. The returned metadata (attributes) are taken from the DB view "sap.secmon.db::AlertExceptionPatternView"
     */
    'EXEMPTIONS_SERVICE' : '/sap/secmon/services/ui/m/alertexceptions/AlertException.xsodata/AlertException',

    /**
     * The pattern execution results ODATA service returns a list of pattern execution results. The returned metadata (attributes) are taken from the DB view
     * "sap.secmon.db::PatternExecutionResultView"
     */
    'PATTERNEXECUTIONRESULTS_SERVICE' : '/sap/secmon/services/patternExecutionResult.xsodata/PatternExecutionResult',

    /**
     * The pattern execution results ODATA service returns a list of pattern execution result details a.k.a resulting alerts. The returned metadata (attributes) are taken from the DB view
     * "sap.secmon.db::PatternExecutionResultAlertView"
     */
    'PATTERNEXECUTIONRESULTALERTS_SERVICE' : '/sap/secmon/services/patternExecutionResult.xsodata/Alerts',

    /**
     * The change log ODATA service returns a list of log entries. The returned metadata (attributes) are taken from the DB view "sap.secmon.services.protocol::ProtocolHeaderView"
     */
    'CHANGELOG_SERVICE' : '/sap/secmon/services/protocol/protocolService.xsodata/ProtocolHeader',

    /**
     * The valuelist entries ODATA service returns values of value lists. The returned metadata (attributes) are taken from DB view "sap.secmon.db::ValueListActiveEntryView"
     */
    'VALUELIST_ENTRIES_SERVICE' : '/sap/secmon/services/ui/m/valuelist/valuelist.xsodata/Values',

    'CONFIGURATIONCHECK_SERVICE' : '/sap/secmon/services/configcheck/ConfigCheck.xsodata/ConfigCheckHeader',

    /**
     * The note implementation entries ODATA service returns statuses of note implementations. The returned metadata (attributes) are taken from DB view "sap.secmon.ssm::NoteSystemOverview"
     */
    'NOTE_IMPLEMENTATION_SERVICE' : '/sap/secmon/services/NoteSystemOverview.xsodata/ImplementationStatusOverview',

    /**
     * The export entries ODATA service returns statuses of export objects. The returned metadata (attributes) are taken from DB view "sap.secmon.services.replication::ContentReplicationExportView"
     */
    'EXPORT_SERVICE' : '/sap/secmon/services/replication/ContentReplication.xsodata/Export',

    /**
     * The import entries ODATA service returns statuses of export objects. The returned metadata (attributes) are taken from DB view "sap.secmon.services.replication::ContentReplicationImportView"
     */
    'IMPORT_SERVICE' : '/sap/secmon/services/replication/ContentReplication.xsodata/Import',

    /**
     * The log types ODATA service returns log types. The returned metadata (attributes) are taken from DB view "sap.secmon.db::KnowledgeBaseLogTypeView_fixed"
     */
    'LOGTYPES_SERVICE' : '/sap/secmon/services/KnowledgeBase.xsodata/LogType_fixed',

    /**
     * The events ODATA service returns log types. The returned metadata (attributes) are taken from DB view "sap.secmon.db::KnowledgeBaseEventView"
     */
    'EVENTS_SERVICE' : '/sap/secmon/services/KnowledgeBase.xsodata/Event',

    /**
     * The log types ODATA service returns log types. The returned metadata (attributes) are taken from DB view "sap.secmon.db::KnowledgeBaseAttrView"
     */
    'ATTRIBUTES_SERVICE' : '/sap/secmon/services/KnowledgeBase.xsodata/Attribute',

    /**
     * The assigned attributes ODATA service returns attributes assigned to semantic events. The returned metadata (attributes) are taken from DB view
     * "sap.secmon.db::KnowledgeBaseEventAttrAssignWithCust"
     */
    'ASSIGNED_ATTRIBUTES_SERVICE' : '/sap/secmon/services/KnowledgeBase.xsodata/Attributes'
};

Object.freeze(sap.secmon.ui.m.commons.ServiceConstants);
