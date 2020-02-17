jQuery.sap.require("sap.secmon.ui.m.anomaly.util.Formatter");



describe("Anomaly Formatter Tests", function () {
    var libUnderTest;
    var spy, oModel;
    beforeEach(function () {
        libUnderTest = sap.secmon.ui.m.anomaly.util.Formatter;
    });
    beforeEach(function () {
        
    });

    describe('titleFormatter', function() {
        it("returns nothing if no texts provided", function () {
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', undefined, undefined)).toBeUndefined();
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', null, undefined)).toBeUndefined();
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', undefined, null)).toBeUndefined();
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', null, null)).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', undefined, undefined)).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', null, undefined)).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', undefined, null)).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', null, null)).toBeUndefined();
         });
        it("returns nothing if one text is not provided", function () {
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', 'Text', undefined)).toBeUndefined();
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', 'Text', null)).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', 'Text', undefined)).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', 'Text', null)).toBeUndefined();
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', undefined, 'Text')).toBeUndefined();
            expect(libUnderTest.titleFormatter('unknown', 'BLA', 'BLUB', null, 'Text')).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', undefined, 'Text')).toBeUndefined();
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', null, 'Text')).toBeUndefined();
        });
        it("returns first text if it runs for a feature", function() {
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', 'BLUB', 'Feature', 'Pattern')).toEqual('Feature: BLUB: BLA');
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, 'BLA', undefined, 'Feature', 'Pattern')).toEqual('Feature: BLA');           
        });
        it("returns second text if it runs for a patterm", function() {
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN, 'BLA', 'BLUB', 'Feature', 'Pattern')).toEqual('Pattern: BLUB: BLA');
            expect(libUnderTest.titleFormatter(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN, 'BLA', undefined, 'Feature', 'Pattern')).toEqual('Pattern: BLA');           
        });        
    });
    describe("exportButtonToolTipText", function() {
        it("returns text, if name and namespace is provided", function() {
            expect(libUnderTest.exportButtonToolTipText('BLA', 'Name', 'namespace')).toEqual('BLA');
            expect(libUnderTest.exportButtonToolTipText('BLA {0} {1}', 'Name', 'namespace')).toEqual('BLA namespace Name');          
        });
        it("returns empty string, if no name or namespace is provided", function() {
            expect(libUnderTest.exportButtonToolTipText('BLA', null, 'namespace')).not.toEqual('BLA');
            expect(libUnderTest.exportButtonToolTipText('BLA', 'Name', null)).toEqual('');
            expect(libUnderTest.exportButtonToolTipText('BLA', undefined, 'namespace')).toEqual('');
            expect(libUnderTest.exportButtonToolTipText('BLA', null, undefined)).toEqual('');
            expect(libUnderTest.exportButtonToolTipText('BLA', undefined, null)).toEqual('');
            expect(libUnderTest.exportButtonToolTipText('BLA', null, null)).toEqual('');
            expect(libUnderTest.exportButtonToolTipText('BLA', undefined, undefined)).toEqual('');           
        });
    });
    describe("analysisTooltipFormatter", function() {
        it("returns first text if name and namespace provided", function() {
            expect(libUnderTest.analysisTooltipFormatter( 'Name', 'namespace', 'BLA', 'BLUB')).toEqual('BLA');
            expect(libUnderTest.analysisTooltipFormatter('Name', 'namespace', 'BLA {0} {1}', 'BLUB')).toEqual('BLA namespace Name');          
        });
        it("returns other text, if no name or namespace is provided", function() {
            expect(libUnderTest.analysisTooltipFormatter( null, 'namespace', 'BLA', 'BLUB')).toEqual('BLUB');
            expect(libUnderTest.analysisTooltipFormatter( 'Name', null, 'BLA', 'BLUB')).toEqual('BLUB');
            expect(libUnderTest.analysisTooltipFormatter( undefined, 'namespace', 'BLA', 'BLUB')).toEqual('BLUB');
            expect(libUnderTest.analysisTooltipFormatter( null, undefined, 'BLA', 'BLUB')).toEqual('BLUB');
            expect(libUnderTest.analysisTooltipFormatter( undefined, null, 'BLA', 'BLUB')).toEqual('BLUB');
            expect(libUnderTest.analysisTooltipFormatter( null, null, 'BLA', 'BLUB')).toEqual('BLUB');
            expect(libUnderTest.analysisTooltipFormatter( undefined, undefined, 'BLA', 'BLUB')).toEqual('BLUB');           
        });
       
    });
    describe("isPatternAndHasId", function() {
        it("returns false if no id is provided or privilege is false", function() {
            expect(libUnderTest.isPatternAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN, false)).toBeFalsy();
            expect(libUnderTest.isPatternAndHasId(null, 'Other')).toBeFalsy();
            expect(libUnderTest.isPatternAndHasId(undefined, 'Other')).toBeFalsy();
            expect(libUnderTest.isPatternAndHasId(null, sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN)).toBeFalsy();
            expect(libUnderTest.isPatternAndHasId(undefined, sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN)).toBeFalsy();           
        });
        it("returns true if a id is provided and type is pattern", function() {
            expect(libUnderTest.isPatternAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN, true)).toBeTruthy();
        });
        it("returns false if a id is provided and type is not pattern", function() {
            expect(libUnderTest.isPatternAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO)).toBeFalsy();
            expect(libUnderTest.isPatternAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.EVALUATION)).toBeFalsy();      
        });
    });
    describe("isScenarioAndHasId", function() {
        it("returns false if no id is provided", function() {
            expect(libUnderTest.isScenarioAndHasId(null, 'Other')).toBeFalsy();
            expect(libUnderTest.isScenarioAndHasId(undefined, 'Other')).toBeFalsy();
            expect(libUnderTest.isScenarioAndHasId(null, sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO)).toBeFalsy();
            expect(libUnderTest.isScenarioAndHasId(undefined, sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO)).toBeFalsy();           
        });
        it("returns true if a id is provided and type is scenario", function() {
            expect(libUnderTest.isScenarioAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO, true)).toBeTruthy();
        });
        it("returns false if a id is provided and type is not scenario", function() {
            expect(libUnderTest.isScenarioAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN)).toBeFalsy();
            expect(libUnderTest.isScenarioAndHasId('1', sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.EVALUATION)).toBeFalsy();      
        });  
    });
    describe("isPattern", function() {
        it("returns true if type is pattern", function() {
            expect(libUnderTest.isPattern(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN)).toBeTruthy();
        });
        it("returns false if type is not pattern", function() {
            expect(libUnderTest.isPattern(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.EVALUATION)).toBeFalsy();            
            expect(libUnderTest.isPattern(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO)).toBeFalsy();            
            expect(libUnderTest.isPattern(undefined)).toBeFalsy();            
            expect(libUnderTest.isPattern(null)).toBeFalsy();            
        });
    });
    describe("isScenario", function() {
        it("returns true if type is scenario and anomalyDetectionWrite privilege is true", function() {
            expect(libUnderTest.isScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO, true)).toEqual(true);
        });
        it("returns false if type is not scenario", function() {
            expect(libUnderTest.isScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.EVALUATION)).toBeFalsy();            
            expect(libUnderTest.isScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN)).toBeFalsy();            
            expect(libUnderTest.isScenario(undefined)).toBeFalsy();            
            expect(libUnderTest.isScenario(null)).toBeFalsy();
            expect(libUnderTest.isScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO, false)).toEqual(false);
            expect(libUnderTest.isScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO, undefined)).toEqual(false);     
        });
    });
    describe("textWithNameAndNameSpace", function() {
        it("returns text with name and namespace, if both are provided", function() {
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', 'name', 'namespace')).toEqual('BLA namespace name');
        });
        it("returns alternative text if one is missing", function() {
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', null, 'namespace')).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', 'name', null)).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', undefined, 'namespace')).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', 'name', undefined)).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', null, undefined)).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', undefined, null)).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', undefined, undefined)).toEqual('BLUB');
            expect(libUnderTest.textWithNameAndNameSpace('BLA {0} {1}', 'BLUB', null, null)).toEqual('BLUB');
       });
    });
 
  
});