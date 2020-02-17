/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library sap.secmon.ui.m.commons.
 */
sap.ui.define([ 'jquery.sap.global', 'sap/ui/core/library' ], // library dependency
function(jQuery) {

    "use strict";

    /**
     * Suite controls library.
     * 
     * @namespace
     * @name sap.secmon.ui.commons
     * @author SAP SE
     * @version ${version}
     * @public
     */

    // delegate further initialization of this library to the Core
    sap.ui.getCore().initLibrary(
            {
                name : "sap.secmon.ui.m.commons",
                version : "${version}",
                dependencies : [ "sap.ui.core" ],
                types : [ "sap.secmon.ui.m.commons.ServiceConstants", "sap.secmon.ui.m.commons.controls.SortOrder" ],
                interfaces : [],
                controls : [ "sap.secmon.ui.m.commons.controls.ColumnClickableTable", "sap.secmon.ui.m.commons.controls.CommaSeparatedLinks",
                        "sap.secmon.ui.m.commons.controls.GeoMapWithClickableLegendItems", "sap.secmon.ui.m.commons.controls.IconWithLinkOrText", "sap.secmon.ui.m.commons.controls.LinkOrText",
                        "sap.secmon.ui.m.commons.controls.MessagePopover", "sap.secmon.ui.m.commons.controls.RadioButton", "sap.secmon.ui.m.commons.controls.RadioButtonGrid",
                        "sap.secmon.ui.m.commons.controls.SortableColumn", "sap.secmon.ui.m.commons.controls.TextWithLinks", "sap.secmon.ui.m.commons.controls.ValidatingComboBox",
                        "sap.secmon.ui.m.commons.controls.VbmLegendItem" ],
                elements : []
            });

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
         * The export entries ODATA service returns statuses of export objects. The returned metadata (attributes) are taken from DB view
         * "sap.secmon.services.replication::ContentReplicationExportView"
         */
        'EXPORT_SERVICE' : '/sap/secmon/services/replication/ContentReplication.xsodata/Export',

        /**
         * The import entries ODATA service returns statuses of export objects. The returned metadata (attributes) are taken from DB view
         * "sap.secmon.services.replication::ContentReplicationImportView"
         */
        'IMPORT_SERVICE' : '/sap/secmon/services/replication/ContentReplication.xsodata/Import'
    };

    jQuery.sap.declare("sap.secmon.ui.m.commons.controls.SortOrder");
    sap.secmon.ui.m.commons.controls.SortOrder = {
        /**
         * Sort Order: ascending.
         * 
         * @public
         */
        Ascending : "Ascending",

        /**
         * Sort Order: descending.
         * 
         * @public
         */
        Descending : "Descending"
    };

    return sap.secmon.ui.m.commons;

}, /* bExport= */false);