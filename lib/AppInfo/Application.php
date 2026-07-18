<?php
namespace OCA\LocalWatermark\AppInfo;

use OCP\AppFramework\App;
use OCP\Util;

class Application extends App {
    public function __construct(array $urlParams = []) {
        parent::__construct('localwatermark', $urlParams);
        Util::addScript('localwatermark', 'localwatermark-files');
    }
}
