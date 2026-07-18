<?php

declare(strict_types=1);

use OCP\Util;

Util::addScript(OCA\LocalWatermark\AppInfo\Application::APP_ID, OCA\LocalWatermark\AppInfo\Application::APP_ID . '-main');
Util::addStyle(OCA\LocalWatermark\AppInfo\Application::APP_ID, OCA\LocalWatermark\AppInfo\Application::APP_ID . '-main');

?>

<div id="localwatermark"></div>
