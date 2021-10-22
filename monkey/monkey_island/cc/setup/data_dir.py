import logging
import shutil
from pathlib import Path

from common.version import get_version
from monkey_island.cc.server_utils.file_utils import create_secure_directory
from monkey_island.cc.setup.version_file_setup import get_version_from_dir, write_version

logger = logging.getLogger(__name__)


class IncompatibleDataDirectory(Exception):
    pass


def setup_data_dir(data_dir_path: Path) -> None:
    logger.info(f"Setting up data directory at {data_dir_path}.")
    if data_dir_path.exists() and _data_dir_version_mismatch_exists(data_dir_path):
        logger.info("Version in data directory does not match the Island's version.")
        _handle_old_data_directory(data_dir_path)
    create_secure_directory(str(data_dir_path))
    write_version(data_dir_path)
    logger.info("Data directory set up.")


def _handle_old_data_directory(data_dir_path: Path) -> None:
    should_delete_data_directory = _prompt_user_to_delete_data_directory(data_dir_path)
    if should_delete_data_directory:
        shutil.rmtree(data_dir_path)
        logger.info(f"{data_dir_path} was deleted.")
    else:
        logger.error(
            "Unable to set up data directory. Please backup and delete the existing data directory"
            f" ({data_dir_path}). Then, try again. To learn how to restore and use a backup, please"
            " refer to the documentation."
        )
        raise IncompatibleDataDirectory()


def _prompt_user_to_delete_data_directory(data_dir_path: Path) -> bool:
    user_response = input(
        f"\nExisting data directory ({data_dir_path}) needs to be deleted."
        " All data from previous runs will be lost. Proceed to delete? (y/n) "
    )
    print()
    if user_response.lower() in {"y", "yes"}:
        return True
    return False


def _data_dir_version_mismatch_exists(data_dir_path: Path) -> bool:
    try:
        data_dir_version = get_version_from_dir(data_dir_path)
    except FileNotFoundError:
        logger.debug("Version file not found.")
        return True

    island_version = get_version()

    return island_version != data_dir_version