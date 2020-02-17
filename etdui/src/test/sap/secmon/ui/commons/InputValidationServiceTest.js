jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");

var libUnderTest;

beforeEach(function() {

});

afterEach(function() {
});

describe("InputValidationService Tests", function() {
 it("checkControls", function() {
        
        var aControls = [];
        var input = new sap.m.Input();
        input.setValue("bla");
        
        aControls.push(input);

        libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);

        var checkResult = libUnderTest.checkControls();
        expect(checkResult).toEqual(true);
        input.setValue("");
        
        checkResult = libUnderTest.checkControls();
        expect(checkResult).toEqual(false);
        
        

    });
 
 it("resetValueState", function() {
     
     var aControls = [];
     var input = new sap.m.Input();
     
     aControls.push(input);

     libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);

     var checkResult = libUnderTest.checkControls();
     
     expect(checkResult).toEqual(false);
     libUnderTest.resetValueStateOfControls();
     expect(input.getValueState()).toEqual(sap.ui.core.ValueState.None);
     

 });
 describe("compareNumbers", function() {
     it("should validate correctly", function() {
         var aControls = [];
         var input = new sap.m.Input();
         aControls.push(input);
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([1], 10);  
         expect(checkResult).toEqual(true);
         expect(input.getValueState()).toEqual(sap.ui.core.ValueState.None);
     });
     it("should validate erroneous", function() {
         var aControls = [];
         var input = new sap.m.Input();
         aControls.push(input);
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([10], 1);  
         expect(checkResult).toEqual(false);
         expect(input.getValueState()).toEqual(sap.ui.core.ValueState.Error);
     });
     it("should validate correctly", function() {
         var aControls = [];
         var input1 = new sap.m.Input(), input2 = new sap.m.Input();
         aControls = [input1, input2];
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([1,2], 10);  
         expect(checkResult).toEqual(true);
         expect(input1.getValueState()).toEqual(sap.ui.core.ValueState.None);
         expect(input2.getValueState()).toEqual(sap.ui.core.ValueState.None);
         
     });
     it("should validate erroneous", function() {
         var aControls = [];
         var input1 = new sap.m.Input(), input2 = new sap.m.Input();
         aControls = [input1, input2];
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([10,1], 2);  
         expect(checkResult).toEqual(false);
         expect(input1.getValueState()).toEqual(sap.ui.core.ValueState.Error);
         expect(input2.getValueState()).toEqual(sap.ui.core.ValueState.None);
     });
     
     it("should validate erroneous", function() {
         var aControls = [];
         var input = new sap.m.Input({visible : false});
         aControls.push(input);
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([1,10], 2);  
         expect(checkResult).toEqual(true);
         expect(input.getValueState()).toEqual(sap.ui.core.ValueState.Error);
     });
     it("should validate erroneous", function() {
         var aControls = [];
         var input = new sap.m.Input({visible : false});
         aControls.push(input);
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([10], 1);  
         expect(checkResult).toEqual(true);
         expect(input.getValueState()).toEqual(sap.ui.core.ValueState.Error);
     });
     it("should validate erroneous", function() {
         var aControls = [];
         var input = new sap.m.Input({visible : false});
         aControls.push(input);
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([10,1], 2);  
         expect(checkResult).toEqual(true);
         expect(input.getValueState()).toEqual(sap.ui.core.ValueState.Error);
     });
     
     it("should validate erroneous", function() {
         var aControls = [];
         var input = new sap.m.Input({visible : false});
         aControls.push(input);
         libUnderTest = new sap.secmon.ui.commons.InputValidationService(aControls);
         var checkResult = libUnderTest.compareNumbers([1,10], 2);  
         expect(checkResult).toEqual(true);
         expect(input.getValueState()).toEqual(sap.ui.core.ValueState.Error);
     });
    
 })
 });