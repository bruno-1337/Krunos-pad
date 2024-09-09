import helpers from './helper';

describe("Helper test", function() {

    beforeEach(function() {
        // Any setup needed before each test
    });

    it("Test convert path to dot path start with bar", function() {
        const path = helpers.urlToDotPath('/krunos/a');
        expect(path).toEqual('krunos.a.content');
    });

    it("Test convert path to dot path contains double bars", function() {
        const path = helpers.urlToDotPath('//krunos//a');
        expect(path).toEqual('krunos.a.content');
    });

    it("Test convert path to dot contains multi bars", function() {
        const path = helpers.urlToDotPath('//krunos/a//');
        expect(path).toEqual('krunos.a.content');
    });

    it("Test convert path to dot contains ens bars", function() {
        const path = helpers.urlToDotPath('//krunos/a/');
        expect(path).toEqual('krunos.a.content');
    });

    it("Test convert path to dot contains ens bars", function() {
        const path = helpers.urlToDotPath('a/a');
        expect(path).toEqual('a.a.content');
    });

});
