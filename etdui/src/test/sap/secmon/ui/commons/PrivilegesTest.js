describe("Privileges Test", function () {
    
    // jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
    var libUnderTest;
    function requirePrivileges(doneFunction) {
        var done = doneFunction;
        if (sap && sap.secmon && sap.secmon.ui && sap.secmon.ui.commons && sap.secmon.ui.commons.Privileges) {
            delete  sap.secmon.ui.commons.Privileges;
         }
         sap.ui.require(['sap/secmon/ui/commons/Privileges'], function(privileges) {
             sap.secmon.ui.commons.Privileges = privileges;
             libUnderTest = sap.secmon.ui.commons.Privileges;
             done();
         });        
    }
    beforeAll(function(done) {
        requirePrivileges(done);
    });
    

    

    afterEach(function () {
    });
    beforeEach(function(done) {
        requirePrivileges(done);
    });
    
    
    it("call privileges from a view", function(){
	
        var oModel = {getObject: function(){
            return {privilege1: true, privilege2: false};
        }};
        var oView = {getModel: function(){
            return oModel;
        }};
        
    	expect(libUnderTest.isAuthorized.call(oView, "privilege1")).toBe(true);
    	expect(libUnderTest.isAuthorized.call(oView, "privilege2")).toBe(false);
    	expect(libUnderTest.isAuthorized.call(oView, "privilege which does not exist")).toBe(false);
    });

    it("call privileges from a controller", function(){
        var oModel = {getObject: function(){
            return {privilege1: true, privilege2: false};
        }};
        var oView = {getModel: function(){
            return oModel;
        }};
    	var oController = {getView: function(){
    	    return oView;
    	}};
        
    	expect(libUnderTest.isAuthorized.call(oController, "privilege1")).toBe(true);
    	expect(libUnderTest.isAuthorized.call(oController, "privilege2")).toBe(false);
    	expect(libUnderTest.isAuthorized.call(oController, "privilege which does not exist")).toBe(false);
    });
});
