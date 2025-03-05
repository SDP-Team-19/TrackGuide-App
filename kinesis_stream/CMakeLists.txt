cmake_minimum_required(VERSION 3.10)
project(KinesisStream)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# Manually specify AWS SDK installation path
set(AWSSDK_DIR "~/Desktop/TrackGuide-App-trackguide-map/aws-sdk-install/lib/cmake/AWSSDK")

find_package(AWSSDK REQUIRED COMPONENTS kinesis core)

add_executable(kinesis_stream kinesis_stream.cpp)
target_link_libraries(kinesis_stream PRIVATE ${AWSSDK_LINK_LIBRARIES})