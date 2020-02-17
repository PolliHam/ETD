jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");

describe("URLParameterTest", function(){
    var libUnderTest;

    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.commons.UrlParameterMappings;

    });

    it("convertToDBFieldName ALERTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);
        expect(lib.convertToDBFieldName("number", true)).toEqual("Number");
        expect(lib.convertToDBFieldName("number")).toEqual("Number");
        expect(function(){lib.convertToDBFieldName("Num");}).toThrowError("IllegalParameterError: URL Parameter 'Num' unknown");
    });
    
    it("convertToDBFieldName Investigation", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE);
        expect(lib.convertToDBFieldName("number", true)).toEqual("Number");
        expect(lib.convertToDBFieldName("number")).toEqual("Number");
        expect(function(){lib.convertToDBFieldName("Num");}).toThrowError("IllegalParameterError: URL Parameter 'Num' unknown");
    });
    
    it("convertToDBFieldName PATTERNS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE);
        expect(lib.convertToDBFieldName("description", true)).toEqual("Description");
        expect(lib.convertToDBFieldName("description")).toEqual("Description");
        expect(function(){lib.convertToDBFieldName("Desc");}).toThrowError("IllegalParameterError: URL Parameter 'Desc' unknown");
    });
    
    it("convertToDBFieldName PATTERNEXECUTIONRESULTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE);
        expect(lib.convertToDBFieldName("configurationName", true)).toEqual("ConfigurationName");
        expect(lib.convertToDBFieldName("configurationName")).toEqual("ConfigurationName");
        expect(function(){lib.convertToDBFieldName("Config");}).toThrowError("IllegalParameterError: URL Parameter 'Config' unknown");
    });
    
    it("convertToDBFieldName EXEMPTIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE);
        expect(lib.convertToDBFieldName("description", true)).toEqual("Description");
        expect(lib.convertToDBFieldName("description")).toEqual("Description");
        expect(function(){lib.convertToDBFieldName("Desc");}).toThrowError("IllegalParameterError: URL Parameter 'Desc' unknown");
    });
    
    it("convertToDBFieldName CHANGELOG_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE);
        expect(lib.convertToDBFieldName("entityType", true)).toEqual("EntityType");
        expect(lib.convertToDBFieldName("entityType")).toEqual("EntityType");
        expect(function(){lib.convertToDBFieldName("Config");}).toThrowError("IllegalParameterError: URL Parameter 'Config' unknown");
    });
    
    it("convertToDBFieldName NOTE_IMPL_STATUS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE);            
        expect(lib.convertToDBFieldName("noteNumber", true)).toEqual("NoteNumber");
        expect(lib.convertToDBFieldName("noteVersion")).toEqual("NoteVersion");
        expect(lib.convertToDBFieldName("noteTitle")).toEqual("NoteTitle");
        expect(lib.convertToDBFieldName("releaseOn")).toEqual("ReleaseOn");
        expect(lib.convertToDBFieldName("systemId")).toEqual("SystemId");
        expect(lib.convertToDBFieldName("systemType")).toEqual("SystemType");
        expect(lib.convertToDBFieldName("implFullyAutomatic")).toEqual("ImplementationFullyAutomatic");
        expect(lib.convertToDBFieldName("cvssBaseScore")).toEqual("CVSSBaseScore");
        expect(lib.convertToDBFieldName("nImplStatus")).toEqual("SNoteImplementationStatus");
        expect(lib.convertToDBFieldName("spImplStatus")).toEqual("SPImplementationStatus");
        expect(lib.convertToDBFieldName("procStatus")).toEqual("SNoteProcessingStatus");
        expect(function(){lib.convertToDBFieldName("Config");}).toThrowError("IllegalParameterError: URL Parameter 'Config' unknown");
    });
    
    it("convertToDBFieldName VALUELISTENTRY_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE);
        expect(lib.convertToDBFieldName("operator", true)).toEqual("Operator");
        expect(lib.convertToDBFieldName("operator")).toEqual("Operator");
        expect(lib.convertToDBFieldName("description", true)).toEqual("Description");
        expect(lib.convertToDBFieldName("value", true)).toEqual("ValueVarChar");
        expect(lib.convertToDBFieldName("value")).toEqual("ValueVarChar");
        expect(lib.convertToDBFieldName("namespace", true)).toEqual("NameSpace");
        expect(lib.convertToDBFieldName("namespace")).toEqual("NameSpace");
        expect(function(){lib.convertToDBFieldName("Config");}).toThrowError("IllegalParameterError: URL Parameter 'Config' unknown");
    });
    
    it("convertToDBFieldName NO_SERVICE", function() {
        var lib = new libUnderTest("NOTEXISTING");
        expect(function(){lib.convertToDBFieldName("Desc");}).toThrowError("IllegalParameterError: ODATA service 'NOTEXISTING' unknown");
    });
    
    it("convertFromDBFieldName ALERTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);
        expect(lib.convertFromDBFieldName("Number", true)).toEqual("number");
        expect(lib.convertFromDBFieldName("Number")).toEqual("number");
        expect(function(){lib.convertFromDBFieldName("Num");}).toThrowError("IllegalParameterError: DB field 'Num' unknown");
    });
    
    it("convertFromDBFieldName Investigation", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE);
        expect(lib.convertFromDBFieldName("Number", true)).toEqual("number");
        expect(lib.convertFromDBFieldName("Number")).toEqual("number");
        expect(function(){lib.convertFromDBFieldName("Num");}).toThrowError("IllegalParameterError: DB field 'Num' unknown");
    });
    
    it("convertFromDBFieldName PATTERNS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE);
        expect(lib.convertFromDBFieldName("Description", true)).toEqual("description");
        expect(lib.convertFromDBFieldName("Description")).toEqual("description");
        expect(function(){lib.convertFromDBFieldName("Desc");}).toThrowError("IllegalParameterError: DB field 'Desc' unknown");
    });
    
    it("convertFromDBFieldName PATTERNEXECUTIONRESULTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE);
        expect(lib.convertFromDBFieldName("ConfigurationName", true)).toEqual("configurationName");
        expect(lib.convertFromDBFieldName("ConfigurationName")).toEqual("configurationName");
        expect(function(){lib.convertFromDBFieldName("Config");}).toThrowError("IllegalParameterError: DB field 'Config' unknown");
    });
    
    it("convertFromDBFieldName EXEMPTIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE);
        expect(lib.convertFromDBFieldName("Description", true)).toEqual("description");
        expect(lib.convertFromDBFieldName("Description")).toEqual("description");
        expect(function(){lib.convertFromDBFieldName("Desc");}).toThrowError("IllegalParameterError: DB field 'Desc' unknown");
    });
    
    it("convertFromDBFieldName CHANGELOG_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE);
        expect(lib.convertFromDBFieldName("EntityType", true)).toEqual("entityType");
        expect(lib.convertFromDBFieldName("EntityType")).toEqual("entityType");
        expect(function(){lib.convertFromDBFieldName("Config");}).toThrowError("IllegalParameterError: DB field 'Config' unknown");
    });
    
    it("convertFromDBFieldName VALUELISTENTRY_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE);
        expect(lib.convertFromDBFieldName("Operator", true)).toEqual("operator");
        expect(lib.convertFromDBFieldName("Operator")).toEqual("operator");
        expect(lib.convertFromDBFieldName("ValueVarChar", true)).toEqual("value");
        expect(lib.convertFromDBFieldName("ValueVarChar")).toEqual("value");
        expect(lib.convertFromDBFieldName("Description", true)).toEqual("description");
        expect(lib.convertFromDBFieldName("NameSpace", true)).toEqual("namespace");
        expect(lib.convertFromDBFieldName("NameSpace")).toEqual("namespace");
        expect(function(){lib.convertFromDBFieldName("Config");}).toThrowError("IllegalParameterError: DB field 'Config' unknown");
    });
    
    it("convertFromDBFieldName NOTE_IMPLEMENTATION_SERVICE", function() {
        
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE);            
        expect(lib.convertFromDBFieldName("NoteNumber", true)).toEqual("noteNumber");
        expect(lib.convertFromDBFieldName("NoteVersion")).toEqual("noteVersion");
        expect(lib.convertFromDBFieldName("NoteTitle", true)).toEqual("noteTitle");
        expect(lib.convertFromDBFieldName("ReleaseOn")).toEqual("releaseOn");
        expect(lib.convertFromDBFieldName("SystemId", true)).toEqual("systemId");
        expect(lib.convertFromDBFieldName("SystemType", true)).toEqual("systemType");
        expect(lib.convertFromDBFieldName("ImplementationFullyAutomatic", true)).toEqual("implFullyAutomatic");
        expect(lib.convertFromDBFieldName("CVSSBaseScore")).toEqual("cvssBaseScore");
        expect(lib.convertFromDBFieldName("SNoteImplementationStatus", true)).toEqual("nImplStatus");
        expect(lib.convertFromDBFieldName("SPImplementationStatus", true)).toEqual("spImplStatus");
        expect(lib.convertFromDBFieldName("SNoteProcessingStatus")).toEqual("procStatus");
        expect(function(){lib.convertFromDBFieldName("Config");}).toThrowError("IllegalParameterError: DB field 'Config' unknown");
    });
    
    it("convertFromDBFieldName NO_SERVICE", function() {
        var lib = new libUnderTest("NOTEXISTING");
        expect(function(){lib.convertFromDBFieldName("Desc");}).toThrowError("IllegalParameterError: ODATA service 'NOTEXISTING' unknown");
    });
    
    
    it("getSupportedDbFieldValues ALERTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);
        expect(lib.getSupportedDbFieldValues(true)).toEqual(["AlertStatus","AlertAttack","PatternId","PatternType","PatternNameSpace","PatternNameSpaceId","AlertSeverity","AlertProcessor",
                                                            "AlertCreationTimestamp","Number","AlertMeasureContext","PatternLikelihoodConfidentiality","PatternLikelihoodIntegritySystem",
                                                            "PatternLikelihoodIntegrityData","PatternLikelihoodAvailability","PatternSuccessConfidentiality","PatternSuccessIntegritySystem",
                                                             "PatternSuccessIntegrityData","PatternSuccessAvailability"]);
        expect(lib.getSupportedDbFieldValues()).toEqual(["AlertStatus","PatternName","PatternType","AlertSeveritySortOrder","AlertProcessor","AlertCreationTimestamp","Number",
                                                         "Score","PatternLikelihoodConfidentiality","PatternLikelihoodIntegritySystem","PatternLikelihoodIntegrityData",
                                                         "PatternLikelihoodAvailability","PatternSuccessConfidentiality","PatternSuccessIntegritySystem",
                                                         "PatternSuccessIntegrityData","PatternSuccessAvailability"]);
    });
    
    it("getSupportedDbFieldValues INVESTIGATIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE);
        expect(lib.getSupportedDbFieldValues(true)).toEqual(["Status","Attack","Severity","Processor","ManagementVisibility","CreationDate","Description","CreatedBy","Number"]);
        expect(lib.getSupportedDbFieldValues()).toEqual(["Status","Severity","Processor","ManagementVisibility","CreationDate","Description","CreatedBy","Number", "Attack", "LastUpdated"]);
    });
    
    it("getSupportedDbFieldValues PATTERNS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE);
        expect(lib.getSupportedDbFieldValues(true)).toEqual(["NameSpaceId","Id","Description","OpenAlertCount","Version","CreatedBy","Status","TestMode","PatternType", "ExecutionOutput", "PatternScenarios"]);
        expect(lib.getSupportedDbFieldValues()).toEqual(["NameSpace","Name","Description","OpenAlertCount","Version","CreatedBy", "Status"]);
    });
    
    it("getSupportedDbFieldValues PATTERNEXECUTIONRESULTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE);
        expect(lib.getSupportedDbFieldValues(true)).toEqual(["ExecutionUser","ExecutionTimeStamp","TotalRuntime","Message","ExecutionMode","ResultStatus",
                                                             "PatternDefinitionId.Id","PatternDescription","ConfigurationName","NumberOfNewAlerts","NumberOfAllAlerts", "PatternNamespaceId"]);
        expect(lib.getSupportedDbFieldValues()).toEqual(["ExecutionUser","ExecutionTimeStamp","TotalRuntime","Message","ExecutionMode","ResultStatus","PatternName","PatternNamespace",
                                                         "PatternDescription","ConfigurationName","NumberOfNewAlerts","NumberOfAllAlerts"]);
    });
    
    
    it("getSupportedDbFieldValues NOTE_IMPLEMENTATION_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE);
        expect(lib.getSupportedDbFieldValues(true)).toEqual(["NoteNumber",
                                                            "NoteTitle",
                                                            "NoteVersion",
                                                            "ReleaseOn",
                                                            "SystemId",
                                                            "SystemType",
                                                            "ImplementationFullyAutomatic",
                                                            "CVSSBaseScore",
                                                            "SNoteImplementationStatus",
                                                            "SPImplementationStatus",
                                                            "SNoteProcessingStatus"]);
        expect(lib.getSupportedDbFieldValues()).toEqual(["NoteNumber",
                                                         "NoteTitle",
                                                         "NoteVersion",
                                                         "ReleaseOn",
                                                         "SystemId",
                                                         "SystemType",
                                                         "ImplementationFullyAutomatic",
                                                         "CVSSBaseScore",
                                                         "SNoteImplementationStatus",
                                                         "SPImplementationStatus",
                                                         "SNoteProcessingStatus"]);
    });
    
    
    it("getSupportedDbFieldValues NO_SERVICE", function() {
        var lib = new libUnderTest("NOTEXISTING");
        expect(function(){lib.getSupportedDbFieldValues();}).toThrowError("IllegalParameterError: ODATA service 'NOTEXISTING' unknown");
    });
    
    it("getSupportedUrlParamNames ALERTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);
        expect(lib.getSupportedUrlParamNames()).toEqual(["status","attack","patternId","patternType", "patternNamespace","patternNamespaceId","severity","processor","creationDate","number",
                                                           "measureContext","plConfidentiality","plIntegritySystem","plIntegrityData","plAvailability","psConfidentiality","psIntegritySystem",
                                                           "psIntegrityData","psAvailability"]);
    });
    
    it("getSupportedUrlParamNames INVESTIGATIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE);
        expect(lib.getSupportedUrlParamNames()).toEqual(["status","attack","severity","processor","managementVisibility","creationDate","description","createdBy","number","LastUpdated"]);
    });
    
    it("getSupportedUrlParamNames PATTERNS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE);
        expect(lib.getSupportedUrlParamNames()).toEqual(["nameSpaceId","id","description","openAlertCount","version","createdBy","status","testMode","patternType", "executionOutput", "scenarios"]);
    });
    
    it("getSupportedUrlParamNames PATTERNEXECUTIONRESULTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE);
        expect(lib.getSupportedUrlParamNames()).toEqual(["executionUser","executionTimestamp","totalRuntime","message","executionMode","resultStatus","patternId",
                                                         "patternDescription","configurationName","numberOfNewAlerts","numberOfAllAlerts", "patternNamespaceId"]);
    });
    
    it("getSupportedUrlParamNames EXEMPTIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE);
        expect(lib.getSupportedUrlParamNames()).toEqual(["nameSpaceId","patternId","description","createdBy","status","testMode","patternType","validity"]);
    });
    
    it("getSupportedUrlParamNames CHANGELOG_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE);
        //expect(lib.getSupportedUrlParamNames()).toEqual(["entityType","timestamp","user","entityNamespace","entityName","entityOperation"]);
    });
    
    it("getSuppportedUrlParamNames VALUELIST_ENTRIES_SERVICE", function(){
       var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE);
       expect(lib.getSupportedUrlParamNames()).toEqual(["operator", "value", "description", "namespace"]);
    });
    
    
    it("getSuppportedUrlParamNames NOTE_IMPLEMENTATION_SERVICE", function(){
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE);
        expect(lib.getSupportedUrlParamNames()).toEqual(["noteNumber",
                                                        "noteTitle",
                                                        "noteVersion",
                                                        "releaseOn",
                                                        "systemId",
                                                        "systemType",
                                                        "implFullyAutomatic",
                                                        "cvssBaseScore",
                                                        "nImplStatus",
                                                        "spImplStatus",
                                                        "procStatus"]);
     });
    
    it("getSupportedUrlParamNames NO_SERVICE", function() {
        var lib = new libUnderTest("NOTEXISTING");
        expect(function(){lib.getSupportedUrlParamNames();}).toThrowError("IllegalParameterError: ODATA service 'NOTEXISTING' unknown");
    });
    
    it("getSupportedOrderByValues ALERTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["status","patternName","severity","processor","creationDate","number","score",
                                                         "plConfidentiality","plIntegritySystem","plIntegrityData","plAvailability",
                                                         "psConfidentiality","psIntegritySystem","psIntegrityData","psAvailability"]);
    });
    
    it("getSupportedOrderByValues INVESTIGATIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["status","severity","processor","managementVisibility","creationDate","description","createdBy","number","attack", "LastUpdated"]);
    });
    
    it("getSupportedOrderByValues PATTERNS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNS_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["nameSpace","name","description","openAlertCount","version","createdBy", "status"]);
    });
    
    it("getSupportedOrderByValues PATTERNEXECUTIONRESULTS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["executionUser","executionTimestamp","totalRuntime","message","executionMode","resultStatus",
                                                         "patternName","patternNamespace","patternDescription","configurationName","numberOfNewAlerts","numberOfAllAlerts"]);
    });
    
    it("getSupportedOrderByValues EXEMPTIONS_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.EXEMPTIONS_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["nameSpace","name","description","createdBy","exemptionDescription","validity"]);
    });
    
    it("getSupportedOrderByValues CHANGELOG_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.CHANGELOG_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["entityType","timestamp","user","entityNamespace","entityName","entityOperation","text"]);
    });
    
    it("getSupportedOrderByValues VALUELIST_ENTRIES_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.VALUELIST_ENTRIES_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["operator","value","namespace"]);
    });
    
    it("getSupportedOrderByValues NOTE_IMPLEMENTATION_SERVICE", function() {
        var lib = new libUnderTest(sap.secmon.ui.m.commons.ServiceConstants.NOTE_IMPLEMENTATION_SERVICE);
        expect(lib.getSupportedOrderByValues()).toEqual(["noteNumber",
                                                         "noteTitle",
                                                         "noteVersion",
                                                         "releaseOn",
                                                         "systemId",
                                                         "systemType",
                                                         "implFullyAutomatic",
                                                         "cvssBaseScore",
                                                         "nImplStatus",
                                                         "spImplStatus",
                                                         "procStatus"]);
    });
    
    it("getSupportedUrlParamNames NO_SERVICE", function() {
        var lib = new libUnderTest("NOTEXISTING");
        expect(function(){lib.getSupportedOrderByValues();}).toThrowError("IllegalParameterError: ODATA service 'NOTEXISTING' unknown");
    });    
});