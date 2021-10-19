// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenArtValouTest is ERC721URIStorage, ERC721Enumerable, Ownable {
    // Must override these methods because of ERC721URIStorage + ERC721Enumerable inheritance
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // End of transparent overrides
    event Mint(
        address indexed to,
        uint256 indexed tokenNumber
    );

    uint256 public constant MAX_TOKENS = 100;
    uint256 public constant MAX_TOKENS_PER_TRANSACTION = 1;
    uint256 public constant PRICE = 0 ether;

    uint256 public constant DEVELOPER_SHARE = 45;
    uint256 public constant ARTIST_SHARE = 45;
    uint256 public constant ADVISOR_SHARE = 10;
    uint256 public constant SHARE_SUM = 100;

    address public developerAddress =
        0x30e7032f92c143E1F5e5118235fC291E7CafA4DD;
    address public artistAddress = 0x30e7032f92c143E1F5e5118235fC291E7CafA4DD;
    address public constant ADVISOR_ADDRESS =
        0x30e7032f92c143E1F5e5118235fC291E7CafA4DD;

    string public script;
    string public scriptType = "p5js";
    string private baseTokenURI;

    bool public saleIsActive = false;

    mapping(uint256 => uint256) public creationDates;

    constructor() ERC721("Gen Art Valou Test", "GAVT") {
        baseTokenURI = "https://gen-art-test-valou.herokuapp.com/json/";
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        baseTokenURI = baseURI;
    }

    function tokensOfOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 index;
            for (index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }

    function mint(uint256 tokenNumber) public payable {
        require(saleIsActive, "Sale must be active to mint");
        require(totalSupply() < MAX_TOKENS, "Purchase would exceed max supply");
        require(
            tokenNumber > 0 && tokenNumber <= MAX_TOKENS_PER_TRANSACTION,
            "Token number must be between 1 and 20"
        );
        require(totalSupply() + tokenNumber <= MAX_TOKENS, "Exceeds supply");
        require(
            msg.value >= PRICE * tokenNumber,
            "Ether value sent is not correct"
        );

        for (uint256 i = 0; i < tokenNumber; i++) {
            uint256 mintIndex = totalSupply();
            _safeMint(msg.sender, mintIndex);
            creationDates[mintIndex] = block.number;
            emit Mint(msg.sender, mintIndex);
        }
    }

    function reserve(uint256 tokenNumber, address toAddress) public onlyOwner {
        require(totalSupply() < MAX_TOKENS, "There are no tokens left");
        require(
            totalSupply() + tokenNumber <= MAX_TOKENS,
            "Exceeds MAX_TOKENS"
        );

        for (uint256 i = 0; i < tokenNumber; i++) {
            uint256 mintIndex = totalSupply();
            _safeMint(toAddress, mintIndex);
            creationDates[mintIndex] = block.number;
            emit Mint(toAddress, mintIndex);
        }
    }

    function setScript(string memory _script) public onlyOwner {
        script = _script;
    }

    function setScriptType(string memory _scriptType) public onlyOwner {
        script = _scriptType;
    }

    function setDeveloperAddress(address _developerAddress) public onlyOwner {
        developerAddress = _developerAddress;
    }

    function setArtistAddress(address _artistAddress) public onlyOwner {
        artistAddress = _artistAddress;
    }

    function flipSaleState() public onlyOwner {
        saleIsActive = !saleIsActive;
    }

    function tokenHash(uint256 tokenId) public view returns (bytes32) {
        require(_exists(tokenId), "DOES NOT EXIST");
        return
            bytes32(
                keccak256(
                    abi.encodePacked(
                        address(this),
                        creationDates[tokenId],
                        tokenId
                    )
                )
            );
    }

    function withdraw() public payable onlyOwner {
        uint256 balance = address(this).balance;

        uint256 toDeveloper = (balance * DEVELOPER_SHARE) / SHARE_SUM;
        uint256 toArtist = (balance * ARTIST_SHARE) / SHARE_SUM;
        uint256 toAdvisor = (balance * ADVISOR_SHARE) / SHARE_SUM;

        payable(developerAddress).transfer(toDeveloper);
        payable(artistAddress).transfer(toArtist);
        payable(ADVISOR_ADDRESS).transfer(toAdvisor);

        assert(address(this).balance == 0);
    }
}
