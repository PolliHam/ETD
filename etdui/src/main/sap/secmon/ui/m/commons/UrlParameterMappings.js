jQuery.sap.declare("sap.secmon.ui.m.commons.UrlParameterMappings");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
/**
 * This is a utility to provide mappings between URL parameter names and corresponding field names of DB tables or DB views. Example: URL parameter "severity" <-> DB field "AlertSeverity".
 * 
 * ******************************************************************************* This is necessary as URL parameters need to be stable, they must be decoupled from internals. They are used in
 * external URLS (sent out in emails) and bookmarks (saved in Fiori launchpad persistence). *******************************************************************************
 * 
 * Caution: This code is exactly(!) duplicated with sap.secmon.services.ui.m.UrlParameterMappings on server side.
 * 
 * @param serviceName
 *            a service defined in ServiceConstants
 */
sap.secmon.ui.m.commons.UrlParameterMappings = function(serviceName) {

    /**
     * mapping from to DB fields to URL parameters for alerts ODATA service. This mapping is used for the use case "filter alerts".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_ALERTFILTER = {
        AlertStatus : "status",
        AlertAttack : "attack",
        PatternId : "patternId",
        PatternType : "patternType",
        PatternNameSpace : "patternNamespace",
        PatternNameSpaceId : "patternNamespaceId",
        AlertSeverity : "severity",
        AlertProcessor : "processor",
        AlertCreationTimestamp : "creationDate",
        Number : "number",
        AlertMeasureContext : "measureContext",
        PatternLikelihoodConfidentiality : "plConfidentiality",
        PatternLikelihoodIntegritySystem : "plIntegritySystem",
        PatternLikelihoodIntegrityData : "plIntegrityData",
        PatternLikelihoodAvailability : "plAvailability",
        PatternSuccessConfidentiality : "psConfidentiality",
        PatternSuccessIntegritySystem : "psIntegritySystem",
        PatternSuccessIntegrityData : "psIntegrityData",
        PatternSuccessAvailability : "psAvailability"
    };

    /**
     * mapping from to DB fields to URL parameters for alerts ODATA service. This mapping is used for the use case "sort alerts".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_ALERTSORT = {
        AlertStatus : "status",
        PatternName : "patternName",
        PatternType : "patternType",
        AlertSeveritySortOrder : "severity",
        AlertProcessor : "processor",
        AlertCreationTimestamp : "creationDate",
        Number : "number",
        Score : "score",
        PatternLikelihoodConfidentiality : "plConfidentiality",
        PatternLikelihoodIntegritySystem : "plIntegritySystem",
        PatternLikelihoodIntegrityData : "plIntegrityData",
        PatternLikelihoodAvailability : "plAvailability",
        PatternSuccessConfidentiality : "psConfidentiality",
        PatternSuccessIntegritySystem : "psIntegritySystem",
        PatternSuccessIntegrityData : "psIntegrityData",
        PatternSuccessAvailability : "psAvailability"
    };

    /**
     * mapping from to URL parameters to fields of alerts ODATA service. This mapping is used for the use case "filter alerts".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_ALERTFILTER = {
        status : "AlertStatus",
        attack : "AlertAttack",
        patternId : "PatternId",
        patternType : "PatternType",
        patternNamespace : "PatternNameSpace",
        patternNamespaceId : "PatternNameSpaceId",
        severity : "AlertSeverity",
        processor : "AlertProcessor",
        creationDate : "AlertCreationTimestamp",
        number : "Number",
        measureContext : "AlertMeasureContext",
        plConfidentiality : "PatternLikelihoodConfidentiality",
        plIntegritySystem : "PatternLikelihoodIntegritySystem",
        plIntegrityData : "PatternLikelihoodIntegrityData",
        plAvailability : "PatternLikelihoodAvailability",
        psConfidentiality : "PatternSuccessConfidentiality",
        psIntegritySystem : "PatternSuccessIntegritySystem",
        psIntegrityData : "PatternSuccessIntegrityData",
        psAvailability : "PatternSuccessAvailability"
    };

    /**
     * mapping from to URL parameters to fields of alerts ODATA service. This mapping is used for the use case "sort alerts".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_ALERTSORT = {
        status : "AlertStatus",
        patternName : "PatternName",
        severity : "AlertSeveritySortOrder",
        processor : "AlertProcessor",
        creationDate : "AlertCreationTimestamp",
        number : "Number",
        score : "Score",
        plConfidentiality : "PatternLikelihoodConfidentiality",
        plIntegritySystem : "PatternLikelihoodIntegritySystem",
        plIntegrityData : "PatternLikelihoodIntegrityData",
        plAvailability : "PatternLikelihoodAvailability",
        psConfidentiality : "PatternSuccessConfidentiality",
        psIntegritySystem : "PatternSuccessIntegritySystem",
        psIntegrityData : "PatternSuccessIntegrityData",
        psAvailability : "PatternSuccessAvailability"
    };

    /**
     * mapping from to DB fields to URL parameters for investigations ODATA service. This mapping is used for the use case "filter investigations".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONFILTER = {
        Status : "status",
        Attack : "attack",
        Severity : "severity",
        Processor : "processor",
        ManagementVisibility : "managementVisibility",
        CreationDate : "creationDate",
        Description : "description",
        CreatedBy : "createdBy",
        Number : "number"
    };

    /**
     * mapping from to DB fields to URL parameters for investigations ODATA service. This mapping is used for the use case "sort investigations".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONSORT = {
        Status : "status",
        Severity : "severity",
        Processor : "processor",
        ManagementVisibility : "managementVisibility",
        CreationDate : "creationDate",
        Description : "description",
        CreatedBy : "createdBy",
        Number : "number",
        Attack : "attack",
        LastUpdated : "LastUpdated"
    };

    /**
     * mapping from to URL parameters to fields of investigations ODATA service. This mapping is used for the use case "filter investigations".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONFILTER = {
        status : "Status",
        attack : "Attack",
        severity : "Severity",
        processor : "Processor",
        managementVisibility : "ManagementVisibility",
        creationDate : "CreationDate",
        description : "Description",
        createdBy : "CreatedBy",
        number : "Number",
        LastUpdated : "LastUpdated"
    };

    /**
     * mapping from to URL parameters to fields of investigations ODATA service. This mapping is used for the use case "sort investigations".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONSORT = {
        status : "Status",
        severity : "Severity",
        processor : "Processor",
        managementVisibility : "ManagementVisibility",
        creationDate : "CreationDate",
        description : "Description",
        createdBy : "CreatedBy",
        number : "Number",
        attack : "Attack",
        LastUpdated : "LastUpdated"
    };

    /**
     * mapping from to DB fields to URL parameters for patterns ODATA service. This mapping is used for the use case "filter patterns".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNFILTER = {
        NameSpaceId : "nameSpaceId",
        Id : "id",
        Description : "description",
        OpenAlertCount : "openAlertCount",
        Version : "version",
        CreatedBy : "createdBy",
        Status : "status",
        TestMode : "testMode",
        PatternType : "patternType",
        ExecutionOutput : "executionOutput",
        PatternScenarios : "scenarios"
    };

    /**
     * mapping from to DB fields to URL parameters for patterns ODATA service. This mapping is used for the use case "sort patterns".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNSORT = {
        NameSpace : "nameSpace",
        Name : "name",
        Description : "description",
        OpenAlertCount : "openAlertCount",
        Version : "version",
        CreatedBy : "createdBy",
        Status : "status"
    };

    /**
     * mapping from to URL parameters to fields of patterns ODATA service. This mapping is used for the use case "filter patterns".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNFILTER = {
        nameSpaceId : "NameSpaceId",
        id : "Id",
        description : "Description",
        openAlertCount : "OpenAlertCount",
        version : "Version",
        createdBy : "CreatedBy",
        status : "Status",
        testMode : "TestMode",
        patternType : "PatternType",
        executionOutput : "ExecutionOutput",
        scenarios : "PatternScenarios"
    };

    /**
     * mapping from to URL parameters to fields of patterns ODATA service. This mapping is used for the use case "sort patterns".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNSORT = {
        nameSpace : "NameSpace",
        name : "Name",
        description : "Description",
        openAlertCount : "OpenAlertCount",
        version : "Version",
        createdBy : "CreatedBy",
        status : "Status"
    };

    var DB_FIELD_TO_URL_PARAM_MAPPING_EXEMPTIONFILTER = {
        NameSpaceId : "nameSpaceId",
        Id : "patternId",
        Description : "description",
        CreatedBy : "createdBy",
        Status : "status",
        TestMode : "testMode",
        PatternType : "patternType",
        ExceptionValidity : "validity"
    };

    /**
     * mapping from to DB fields to URL parameters for patterns ODATA service. This mapping is used for the use case "sort patterns".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_EXEMPTIONSORT = {
        NameSpace : "nameSpace",
        Name : "name",
        Description : "description",
        CreatedBy : "createdBy",
        ExceptionDescription : "exemptionDescription",
        "ExceptionValidity,ExceptionValid" : "validity"
    };

    /**
     * mapping from to URL parameters to fields of patterns ODATA service. This mapping is used for the use case "filter exemptions".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_EXEMPTIONFILTER = {
        nameSpaceId : "NameSpaceId",
        patternId : "Id",
        description : "Description",
        createdBy : "CreatedBy",
        status : "Status",
        testMode : "TestMode",
        patternType : "PatternType",
        validity : "ExceptionValidity"
    };

    /**
     * mapping from to URL parameters to fields of patterns ODATA service. This mapping is used for the use case "sort exemptions".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_EXEMPTIONSORT = {
        nameSpace : "NameSpace",
        name : "Name",
        description : "Description",
        createdBy : "CreatedBy",
        exemptionDescription : "ExceptionDescription",
        validity : "ExceptionValidity,ExceptionValid"
    };

    /**
     * mapping from to DB fields to URL parameters for pattern execution results ODATA service. This mapping is used for the use case "filter pattern execution results".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNEXECRESULTFILTER = {
        ExecutionUser : "executionUser",
        ExecutionTimeStamp : "executionTimestamp",
        TotalRuntime : "totalRuntime",
        Message : "message",
        ExecutionMode : "executionMode",
        ResultStatus : "resultStatus",
        "PatternDefinitionId.Id" : "patternId",
        PatternDescription : "patternDescription",
        ConfigurationName : "configurationName",
        NumberOfNewAlerts : "numberOfNewAlerts",
        NumberOfAllAlerts : "numberOfAllAlerts",
        PatternNamespaceId : "patternNamespaceId"
    };

    /**
     * mapping from to DB fields to URL parameters for pattern execution results ODATA service. This mapping is used for the use case "sort pattern execution results".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNEXECRESULTSORT = {
        ExecutionUser : "executionUser",
        ExecutionTimeStamp : "executionTimestamp",
        TotalRuntime : "totalRuntime",
        Message : "message",
        ExecutionMode : "executionMode",
        /*
         * Is there a natural order for "resultStatus"? It contains "Error", "Ok", and "?".
         */
        ResultStatus : "resultStatus",
        PatternName : "patternName",
        PatternNamespace : "patternNamespace",
        PatternDescription : "patternDescription",
        ConfigurationName : "configurationName",
        NumberOfNewAlerts : "numberOfNewAlerts",
        NumberOfAllAlerts : "numberOfAllAlerts"
    };

    /**
     * mapping from to URL parameters to fields of pattern execution results ODATA service. This mapping is used for the use case "filter pattern execution results".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNEXECRESULTFILTER = {
        executionUser : "ExecutionUser",
        executionTimestamp : "ExecutionTimeStamp",
        totalRuntime : "TotalRuntime",
        message : "Message",
        executionMode : "ExecutionMode",
        resultStatus : "ResultStatus",
        patternId : "PatternDefinitionId.Id",
        patternDescription : "PatternDescription",
        configurationName : "ConfigurationName",
        numberOfNewAlerts : "NumberOfNewAlerts",
        numberOfAllAlerts : "NumberOfAllAlerts",
        patternNamespaceId : "PatternNamespaceId"
    };

    /**
     * mapping from to URL parameters to fields of pattern execution results ODATA service. This mapping is used for the use case "sort pattern execution results".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNEXECRESULTSORT = {
        executionUser : "ExecutionUser",
        executionTimestamp : "ExecutionTimeStamp",
        totalRuntime : "TotalRuntime",
        message : "Message",
        executionMode : "ExecutionMode",
        /*
         * Is there a natural order for "resultStatus"? It contains "Error", "Ok", and "?".
         */
        resultStatus : "ResultStatus",
        patternName : "PatternName",
        patternNamespace : "PatternNamespace",
        patternDescription : "PatternDescription",
        configurationName : "ConfigurationName",
        numberOfNewAlerts : "NumberOfNewAlerts",
        numberOfAllAlerts : "NumberOfAllAlerts"
    };

    /**
     * mapping from to DB fields to URL parameters for change log ODATA service. This mapping is used for the use case "filter change log".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_CHANGELOGFILTER = {
        EntityType : "entityType",
        EntityOperation : "entityOperation",
        User : "user",
        EntityName : "entityName",
        EntityNamespace : "entityNamespace"
    };

    /**
     * mapping from to DB fields to URL parameters for change log ODATA service. This mapping is used for the use case "sort change log".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_CHANGELOGSORT = {
        EntityType : "entityType",
        Timestamp : "timestamp",
        User : "user",
        EntityNamespace : "entityNamespace",
        EntityName : "entityName",
        EntityOperation : "entityOperation",
        Text : "text"
    };

    /**
     * mapping from to URL parameters to fields of change log ODATA service. This mapping is used for the use case "filter change log".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_CHANGELOGFILTER = {
        entityType : "EntityType",
        entityOperation : "EntityOperation",
        user : "User",
        entityName : "EntityName",
        entityNamespace : "EntityNamespace",
    };

    /**
     * mapping from to URL parameters to fields of change log ODATA service. This mapping is used for the use case "sort change log".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_CHANGELOGSORT = {
        entityType : "EntityType",
        timestamp : "Timestamp",
        user : "User",
        entityNamespace : "EntityNamespace",
        entityName : "EntityName",
        entityOperation : "EntityOperation",
        text : "Text"
    };

    /**
     * mapping from to DB fields to URL parameters for value list entry ODATA service. This mapping is used for the use case "filter value list entries".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_VALUELISTENTRYFILTER = {
        Operator : "operator",
        ValueVarChar : "value",
        Description : "description",
        NameSpace : "namespace"
    };

    /**
     * mapping from to DB fields to URL parameters for value list ODATA service. This mapping is used for the use case "sort value list entries".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_VALUELISTENTRYSORT = {
        Operator : "operator",
        ValueVarChar : "value",
        NameSpace : "namespace"
    };

    /**
     * mapping from to URL parameters to fields of value list entry ODATA service. This mapping is used for the use case "filter value list entries".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_VALUELISTENTRYFILTER = {
        operator : "Operator",
        value : "ValueVarChar",
        description : "Description",
        namespace : "NameSpace"
    };

    /**
     * mapping from to URL parameters to fields of value list entry ODATA service. This mapping is used for the use case "sort value list entries".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_VALUELISTENTRYSORT = {
        operator : "Operator",
        value : "ValueVarChar",
        namespace : "NameSpace"
    };

    /**
     * mapping from to DB fields to URL parameters for change log ODATA service. This mapping is used for the use case "filter change log".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_CONFIGCHECKFILTER = {
        MainSystemId : "mainSystemId",
        SystemId : "systemId",
        Role : "role",
        DataSource : "dataSource",
        AggregatedStatusLevel : "aggregatedStatusLevel"
    };

    /**
     * mapping from to DB fields to URL parameters for change log ODATA service. This mapping is used for the use case "sort change log".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_CONFIGCHECKSORT = {
        MainSystemId : "mainSystemId",
        SystemId : "systemId",
        Role : "role",
        DataSource : "dataSource",
        AggregatedStatusLevel : "aggregatedStatusLevel"
    };

    /**
     * mapping from to URL parameters to fields of change log ODATA service. This mapping is used for the use case "filter change log".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_CONFIGCHECKFILTER = {
        mainSystemId : "MainSystemId",
        systemId : "SystemId",
        role : "Role",
        dataSource : "DataSource",
        aggregatedStatusLevel : "AggregatedStatusLevel"
    };

    /**
     * mapping from to URL parameters to fields of change log ODATA service. This mapping is used for the use case "sort change log".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_CONFIGCHECKSORT = {
        mainSystemId : "MainSystemId",
        systemId : "SystemId",
        role : "Role",
        dataSource : "DataSource",
        aggregatedStatusLevel : "AggregatedStatusLevel"
    };

    /**
     * mapping from to DB fields to URL parameters for investigation templates ODATA service. This mapping is used for the use case "filter investigation templates".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONTEMPLATEFILTER = {
        Attack : "attack",
        Severity : "severity",
        ManagementVisibility : "managementVisibility",
        Description : "description",
        PatternName : "patternName",
        PatternNameSpace : "patternNamespace",
        PatternId : "patternId",
        PatternType : "patternType",
        TemplateCreationDate : "templateCreationDate",
        TemplateCreatedBy : "templateCreatedBy",
        TemplateDescription : "templateDescription"
    };

    /**
     * mapping from to DB fields to URL parameters for investigations ODATA service. This mapping is used for the use case "sort investigation templates".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONTEMPLATESORT = {
        Attack : "attack",
        Severity : "severity",
        ManagementVisibility : "managementVisibility",
        Description : "description",
        PatternName : "patternName",
        PatternNameSpace : "patternNamespace",
        PatternType : "patternType",
        TemplateCreationDate : "templateCreationDate",
        TemplateCreatedBy : "templateCreatedBy",
        TemplateDescription : "templateDescription"
    };

    /**
     * mapping from to URL parameters to fields of investigations ODATA service. This mapping is used for the use case "filter investigation templates".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONTEMPLATEFILTER = {
        attack : "Attack",
        severity : "Severity",
        managementVisibility : "ManagementVisibility",
        description : "Description",
        patternName : "PatternName",
        patternNamespace : "PatternNameSpace",
        patternId : "PatternId",
        patternType : "PatternType",
        templateCreationDate : "TemplateCreationDate",
        templateCreatedBy : "TemplateCreatedBy",
        templateDescription : "TemplateDescription"
    };

    /**
     * mapping from to URL parameters to fields of investigations ODATA service. This mapping is used for the use case "sort investigation templates".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONTEMPLATESORT = {
        attack : "Attack",
        severity : "Severity",
        managementVisibility : "ManagementVisibility",
        description : "Description",
        patternName : "PatternName",
        patternNamespace : "PatternNameSpace",
        patternType : "PatternType",
        templateCreationDate : "TemplateCreationDate",
        templateCreatedBy : "TemplateCreatedBy",
        templateDescription : "TemplateDescription"
    };

    /**
     * mapping from to DB fields to URL parameters for note implementation status ODATA service. This mapping is used for the use case "display status of note implementation".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_NOTEIMPLFILTER = {
        NoteNumber : "noteNumber",
        NoteTitle : "noteTitle",
        NoteVersion : "noteVersion",
        ReleaseOn : "releaseOn",
        SystemId : "systemId",
        SystemType : "systemType",
        ImplementationFullyAutomatic : "implFullyAutomatic",
        CVSSBaseScore : "cvssBaseScore",
        SNoteImplementationStatus : "nImplStatus",
        SPImplementationStatus : "spImplStatus",
        SNoteProcessingStatus : "procStatus"
    };

    /**
     * mapping from to DB fields to URL parameters for note implementation status ODATA service.
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_NOTEIMPLSORT = {
        NoteNumber : "noteNumber",
        NoteTitle : "noteTitle",
        NoteVersion : "noteVersion",
        ReleaseOn : "releaseOn",
        SystemId : "systemId",
        SystemType : "systemType",
        ImplementationFullyAutomatic : "implFullyAutomatic",
        CVSSBaseScore : "cvssBaseScore",
        SNoteImplementationStatus : "nImplStatus",
        SPImplementationStatus : "spImplStatus",
        SNoteProcessingStatus : "procStatus"
    };

    /**
     * mapping from to URL parameters to fields of note implementation status ODATA service.
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_NOTEIMPLFILTER = {
        noteNumber : "NoteNumber",
        noteTitle : "NoteTitle",
        noteVersion : "NoteVersion",
        releaseOn : "ReleaseOn",
        systemId : "SystemId",
        systemType : "SystemType",
        implFullyAutomatic : "ImplementationFullyAutomatic",
        cvssBaseScore : "CVSSBaseScore",
        nImplStatus : "SNoteImplementationStatus",
        spImplStatus : "SPImplementationStatus",
        procStatus : "SNoteProcessingStatus"
    };

    /**
     * mapping from to URL parameters to fields of note implementation status ODATA service.
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_NOTEIMPLSORT = {
        noteNumber : "NoteNumber",
        noteTitle : "NoteTitle",
        noteVersion : "NoteVersion",
        releaseOn : "ReleaseOn",
        systemId : "SystemId",
        systemType : "SystemType",
        implFullyAutomatic : "ImplementationFullyAutomatic",
        cvssBaseScore : "CVSSBaseScore",
        nImplStatus : "SNoteImplementationStatus",
        spImplStatus : "SPImplementationStatus",
        procStatus : "SNoteProcessingStatus"
    };

    /**
     * mapping from to DB fields to URL parameters for export ODATA service. This mapping is used for the use case "filter export objects".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_EXPORTFILTER = {
        Operation : "operation",
        Status : "status",
        ObjectType : "type",
        ObjectTypeArea : "area",
        CreatedBy : "createdBy",
        CreatedTimestamp : "createdTimestamp"
    };

    /**
     * mapping from to DB fields to URL parameters for export ODATA service. This mapping is used for the use case "sort export objects".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_EXPORTSORT = {
        Operation : "operation",
        Status : "status",
        ObjectType : "type",
        ObjectTypeArea : "area",
        CreatedBy : "createdBy",
        CreatedTimestamp : "createdTimestamp"
    };

    /**
     * mapping from to URL parameters to fields of export ODATA service. This mapping is used for the use case "filter export objects".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_EXPORTFILTER = {
        operation : "Operation",
        status : "Status",
        type : "ObjectType",
        area : "ObjectTypeArea",
        createdBy : "CreatedBy",
        createdTimestamp : "CreatedTimestamp"
    };

    /**
     * mapping from to URL parameters to fields of export ODATA service. This mapping is used for the use case "sort export objects".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_EXPORTSORT = {
        operation : "Operation",
        status : "Status",
        type : "ObjectType",
        area : "ObjectTypeArea",
        createdBy : "CreatedBy",
        createdTimestamp : "CreatedTimestamp"
    };

    /**
     * mapping from to DB fields to URL parameters for import ODATA service. This mapping is used for the use case "filter import objects".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_IMPORTFILTER = {
        Operation : "operation",
        Status : "status",
        ObjectType : "type",
        ObjectTypeArea : "area",
        CreatedBy : "createdBy",
        CreatedTimestamp : "createdTimestamp",
        ChangedTimestamp : "changedTimestamp"
    };

    /**
     * mapping from to DB fields to URL parameters for import ODATA service. This mapping is used for the use case "sort import objects".
     */
    var DB_FIELD_TO_URL_PARAM_MAPPING_IMPORTSORT = {
        Operation : "operation",
        Status : "status",
        ObjectType : "type",
        ObjectTypeArea : "area",
        CreatedBy : "createdBy",
        CreatedTimestamp : "createdTimestamp",
        ChangedTimestamp : "changedTimestamp"
    };

    /**
     * mapping from to URL parameters to fields of import ODATA service. This mapping is used for the use case "filter import objects".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_IMPORTFILTER = {
        operation : "Operation",
        status : "Status",
        type : "ObjectType",
        area : "ObjectTypeArea",
        createdBy : "CreatedBy",
        createdTimestamp : "CreatedTimestamp",
        changedTimestamp : "ChangedTimestamp"
    };

    /**
     * mapping from to URL parameters to fields of import ODATA service. This mapping is used for the use case "sort import objects".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_IMPORTSORT = {
        operation : "Operation",
        status : "Status",
        type : "ObjectType",
        area : "ObjectTypeArea",
        createdBy : "CreatedBy",
        createdTimestamp : "CreatedTimestamp",
        changedTimestamp : "ChangedTimestamp",
    };

    /**
     * mapping from DB fields to URL parameters for the events ODATA service. This mapping is used for the use case "sort events".
     */
    var URL_PARAM_TO_DB_FIELD_MAPPING_EVENTS_SORT = {
        nameSpace : "namespace",
        name : "name",
        displayName : "displayName",
        CreatedBy : "createdBy",
        description : "description"
    };

    /**
     * convert a url parameter name to the corresponding field name in supplied database table or view.
     * 
     * @param urlParamName
     *            parameter name, e.g. "severity"
     * @param bForFiltering
     *            if true, the mapping for filtering is returned. Otherwise, the mapping for sorting is returned.
     */
    this.convertToDBFieldName = _convertToDBFieldName;
    function _convertToDBFieldName(urlParamName, bForFiltering) {
        var dbField;
        switch (serviceName) {

        case sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_ALERTFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_ALERTSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNEXECRESULTFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNEXECRESULTSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_EXEMPTIONFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_EXEMPTIONSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_CHANGELOGFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_CHANGELOGSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_VALUELISTENTRYFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_VALUELISTENTRYSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.CONFIGURATIONCHECK_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_CONFIGCHECKFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_CONFIGCHECKSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONTEMPLATEFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONTEMPLATESORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_NOTEIMPLFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_NOTEIMPLSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.EXPORT_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_EXPORTFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_EXPORTSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.IMPORT_SERVICE:
            if (bForFiltering === true) {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_IMPORTFILTER[urlParamName];
            } else {
                dbField = URL_PARAM_TO_DB_FIELD_MAPPING_IMPORTSORT[urlParamName];
            }
            if (dbField) {
                return dbField;
            }
            throw new Error("IllegalParameterError: URL Parameter '" + urlParamName + "' unknown");

        default:
            throw new Error("IllegalParameterError: ODATA service '" + serviceName + "' unknown");
        }

    }

    /**
     * convert a field name in supplied database table or view to corresponding URL parameter name.
     * 
     * @param dbFieldName
     *            parameter name, e.g. "AlertSeverity"
     * @param bForFiltering
     *            if true, the mapping for filtering is returned. Otherwise, the mapping for sorting is returned.
     */
    this.convertFromDBFieldName = _convertFromDBFieldName;
    function _convertFromDBFieldName(dbFieldName, bForFiltering) {
        var urlParam;
        switch (serviceName) {
        case sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_ALERTFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_ALERTSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNEXECRESULTFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNEXECRESULTSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_EXEMPTIONFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_EXEMPTIONSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_CHANGELOGFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_CHANGELOGSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_VALUELISTENTRYFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_VALUELISTENTRYSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.CONFIGURATIONCHECK_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_CONFIGCHECKFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_CONFIGCHECKSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONTEMPLATEFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONTEMPLATESORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_NOTEIMPLFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_NOTEIMPLSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.EXPORT_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_EXPORTFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_EXPORTSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.IMPORT_SERVICE:
            if (bForFiltering === true) {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_IMPORTFILTER[dbFieldName];
            } else {
                urlParam = DB_FIELD_TO_URL_PARAM_MAPPING_IMPORTSORT[dbFieldName];
            }
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        case sap.secmon.ui.m.commons.ServiceConstants.EVENTS_SERVICE:
            urlParam = URL_PARAM_TO_DB_FIELD_MAPPING_EVENTS_SORT[dbFieldName];
            if (urlParam) {
                return urlParam;
            }
            throw new Error("IllegalParameterError: DB field '" + dbFieldName + "' unknown");

        default:
            throw new Error("IllegalParameterError: ODATA service '" + serviceName + "' unknown");
        }
    }

    /**
     * get all allowed DB fields
     * 
     * @param bForFiltering
     *            if true, the allowed DB fields for filtering is returned. Otherwise, the allowed DB fields for sorting are returned.
     * @return an array of the form ["AlertSeverity", "AlertProcessor", ...], or ["AlertSeveritySortOrder", "AlertProcessor", ...], respectively
     */
    this.getSupportedDbFieldValues = _getSupportedDbFieldValues;
    function _getSupportedDbFieldValues(bForFiltering) {
        var objectKeys;
        switch (serviceName) {
        case sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_ALERTFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_ALERTSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNEXECRESULTFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_PATTERNEXECRESULTSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_VALUELISTENTRYFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_VALUELISTENTRYSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONTEMPLATEFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_INVESTIGATIONTEMPLATESORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_NOTEIMPLFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_NOTEIMPLSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.EXPORT_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_EXPORTFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_EXPORTSORT);
            }
            break;

        case sap.secmon.ui.m.commons.ServiceConstants.IMPORT_SERVICE:
            if (bForFiltering === true) {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_IMPORTFILTER);
            } else {
                objectKeys = Object.keys(DB_FIELD_TO_URL_PARAM_MAPPING_IMPORTSORT);
            }
            break;

        default:
            throw new Error("IllegalParameterError: ODATA service '" + serviceName + "' unknown");
        }
        return objectKeys;
    }

    /**
     * get all allowed URL parameter names
     * 
     * @return an array of the form ["orderDesc", "orderBy", "severity", "processor", ...]
     */
    this.getSupportedUrlParamNames = _getSupportedUrlParamNames;
    function _getSupportedUrlParamNames() {
        switch (serviceName) {
        case sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_ALERTFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNEXECRESULTFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_EXEMPTIONFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_CHANGELOGFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_VALUELISTENTRYFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.CONFIGURATIONCHECK_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_CONFIGCHECKFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONTEMPLATEFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_NOTEIMPLFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.EXPORT_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_EXPORTFILTER);
        case sap.secmon.ui.m.commons.ServiceConstants.IMPORT_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_IMPORTFILTER);
        default:
            throw new Error("IllegalParameterError: ODATA service '" + serviceName + "' unknown");
        }
    }

    /**
     * get all allowed values for the "orderBy" URL parameter
     * 
     * @return an array of the form ["severity", "processor", ...]
     */
    this.getSupportedOrderByValues = _getSupportedOrderByValues;
    function _getSupportedOrderByValues() {
        switch (serviceName) {
        case sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_ALERTSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_PATTERNEXECRESULTSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_EXEMPTIONSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_CHANGELOGSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_VALUELISTENTRYSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.CONFIGURATIONCHECK_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_CONFIGCHECKSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONTEMPLATES_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_INVESTIGATIONTEMPLATESORT);
        case sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_NOTEIMPLSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.EXPORT_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_EXPORTSORT);
        case sap.secmon.ui.m.commons.ServiceConstants.IMPORT_SERVICE:
            return Object.keys(URL_PARAM_TO_DB_FIELD_MAPPING_IMPORTSORT);
        default:
            throw new Error("IllegalParameterError: ODATA service '" + serviceName + "' unknown");
        }
    }

};
